
#include "config.h"
extern "C" {
#include "libavfilter/avfilter.h"
#include "libavformat/avformat.h"
}

#include <QThread>
#include <QMutex>
#include <QWaitCondition>

#include "sc_exception.h"
#include "sc_player.h"
#include "sc_qt_player.h"

#define ERR_SC_PLAYER -4


extern struct SwsContext *sc_sws_opts;
static int64_t sws_flags = SWS_BICUBIC;

AVPacket sc_player::flush_pkt = {0};

void SaveFrame(AVFrame *pFrame, int width, int height, int iFrame) ;

sc_player::sc_player(QWidget *parent)
  :  QGLWidget(parent)
  ,  channel( "" )
  ,  framedrop( -1)
  ,  seek_by_bytes( -1 )
  ,  start_time( AV_NOPTS_VALUE)
  ,  audio_disable( 1 )
  ,  video_disable( 0 )
  ,  subtitle_disable(1 )
  ,  show_status(1 )
  ,  show_mode(VideoState::SHOW_MODE_VIDEO)
  ,  infinite_buffer( 1 )
  ,  loop( 1 )
  ,  autoexit( 0 )
  ,  display_disable( 0)
  ,  duration ( AV_NOPTS_VALUE)
  ,  av_sync_type (AV_SYNC_VIDEO_MASTER)
  ,  lowres( 0)
  ,  workaround_bugs( 1)
  ,  fast( 0)
  ,  error_concealment( 3)
  ,  rdftspeed( 0.02)
  , wc_read_thread( new QWaitCondition )

{
    av_init_packet(&flush_pkt);
    flush_pkt.data = (uint8_t *)&flush_pkt;

    is =( VideoState* ) av_mallocz( sizeof( VideoState ));
    if (!is) throw sc_exception( ERR_SC_PLAYER );

    x_decoder = 0;
}

void sc_player::change_channel( string url )
{
    channel = url;
}


void sc_player::video_image_display()
{
}

/* display the current picture, if any */
void sc_player::video_display()
{
   if (is->video_st)
        video_image_display();
}


double sc_player::get_clock(Clock *c)
{
    if (*c->queue_serial != c->serial)
        return NAN;
    if (c->paused) {
        return c->pts;
    } else {
        double time = av_gettime() / 1000000.0;
        return c->pts_drift + time - (time - c->last_updated) * (1.0 - c->speed);
    }
}

void sc_player::set_clock_at(Clock *c, double pts, int serial, double time)
{
    c->pts = pts;
    c->last_updated = time;
    c->pts_drift = c->pts - time;
    c->serial = serial;
}

void sc_player::set_clock(Clock *c, double pts, int serial)
{
    double time = av_gettime() / 1000000.0;
    set_clock_at(c, pts, serial, time);
}


void sc_player::set_clock_speed(Clock *c, double speed)
{
    set_clock(c, get_clock(c), c->serial);
    c->speed = speed;
}
void sc_player::init_clock(Clock *c, int *queue_serial)
{
    c->speed = 1.0;
    c->paused = 0;
    c->queue_serial = queue_serial;
    set_clock(c, NAN, -1);
}


void sc_player::sync_clock_to_slave(Clock *c, Clock *slave)
{
    double clock = get_clock(c);
    double slave_clock = get_clock(slave);
    if (!isnan(slave_clock) && (isnan(clock) || fabs(clock - slave_clock) > AV_NOSYNC_THRESHOLD))
        set_clock(c, slave_clock, slave->serial);
}


int sc_player::get_master_sync_type() {
    if (is->av_sync_type == AV_SYNC_VIDEO_MASTER && is->video_st ) {
             return AV_SYNC_VIDEO_MASTER;
    }
    else {
        return AV_SYNC_EXTERNAL_CLOCK;
    }
}

/* get the current master clock value */
double sc_player::get_master_clock()
{
    double val;

    switch (get_master_sync_type()) {
        case AV_SYNC_VIDEO_MASTER:
            val = get_clock(&is->vidclk);
            break;
        case AV_SYNC_AUDIO_MASTER:
            val = get_clock(&is->audclk);
            break;
        default:
            val = get_clock(&is->extclk);
            break;
    }
    return val;
}

void sc_player::check_external_clock_speed() {

   double speed = is->extclk.speed;
   if (speed != 1.0)
       set_clock_speed(&is->extclk, speed + EXTERNAL_CLOCK_SPEED_STEP * (1.0 - speed) / fabs(1.0 - speed));

}



void sc_player::step_to_next_frame()
{
    /* if the stream is paused unpause it, then step */
    if (is->paused)
        stream_toggle_pause();
    is->step = 1;
}

double sc_player::compute_target_delay(double delay )
{
    double sync_threshold, diff;

    /* update delay to follow master synchronisation source */
    if (get_master_sync_type() != AV_SYNC_VIDEO_MASTER) {
        /* if video is slave, we try to correct big delays by
           duplicating or deleting a frame */
        diff = get_clock(&is->vidclk) - get_master_clock();

        /* skip or repeat frame. We take into account the
           delay to compute the threshold. I still don't know
           if it is the best guess */
        sync_threshold = FFMAX(AV_SYNC_THRESHOLD_MIN, FFMIN(AV_SYNC_THRESHOLD_MAX, delay));
        if (!isnan(diff) && fabs(diff) < is->max_frame_duration) {
            if (diff <= -sync_threshold)
                delay = FFMAX(0, delay + diff);
            else if (diff >= sync_threshold && delay > AV_SYNC_FRAMEDUP_THRESHOLD)
                delay = delay + diff;
            else if (diff >= sync_threshold)
                delay = 2 * delay;
        }
    }

    av_dlog(NULL, "video: delay=%0.3f A-V=%f\n",
            delay, -diff);

    return delay;
}

void sc_player::pictq_next_picture() {
    /* update queue size and signal for next picture */
    if (++is->pictq_rindex == VIDEO_PICTURE_QUEUE_SIZE)
        is->pictq_rindex = 0;

    sc_log( is->pictq_rindex );

    pictq_mutex->lock();
    is->pictq_size--;
    pictq_cond->wakeOne();
    pictq_mutex->unlock();

}

int sc_player::pictq_prev_picture() {
    VideoPicture *prevvp;
    int ret = 0;
    /* update queue size and signal for the previous picture */
    prevvp = &is->pictq[(is->pictq_rindex + VIDEO_PICTURE_QUEUE_SIZE - 1) % VIDEO_PICTURE_QUEUE_SIZE];
    if (prevvp->allocated && prevvp->serial == is->videoq.serial) {

        pictq_mutex->lock();
        if (is->pictq_size < VIDEO_PICTURE_QUEUE_SIZE) {
            if (--is->pictq_rindex == -1)
                is->pictq_rindex = VIDEO_PICTURE_QUEUE_SIZE - 1;
            is->pictq_size++;
            ret = 1;
        }

        pictq_cond->wakeOne();
        pictq_mutex->unlock();
    }
    return ret;
}


void sc_player::update_video_pts( double pts, int64_t pos, int serial) {
    /* update current video pts */
    set_clock(&is->vidclk, pts, serial);
    sync_clock_to_slave(&is->extclk, &is->vidclk);
    is->video_current_pos = pos;
    is->frame_last_pts = pts;
}

/* called to display each frame */
void sc_player::video_refresh(void *opaque, double *remaining_time)
{
    sc_player *wnd = ( sc_player * ) opaque;
    VideoState *is = wnd->is;

    VideoPicture *vp;
    double time;

    if (!is->paused && wnd->get_master_sync_type() == AV_SYNC_EXTERNAL_CLOCK && is->realtime)
        wnd->check_external_clock_speed();

    if (!wnd->display_disable && is->show_mode != VideoState::SHOW_MODE_VIDEO ) {
        time = av_gettime() / 1000000.0;
        if (is->force_refresh || is->last_vis_time + wnd->rdftspeed < time) {
            wnd->video_display();
            is->last_vis_time = time;
        }
        *remaining_time = FFMIN(*remaining_time, is->last_vis_time + wnd->rdftspeed - time);
    }

    if (is->video_st) {
        int redisplay = 0;
        if (is->force_refresh)
            redisplay = wnd->pictq_prev_picture();

        while( 1 )
        {
            if (is->pictq_size == 0)
            {

                wnd->pictq_mutex->lock();
                if (is->frame_last_dropped_pts != AV_NOPTS_VALUE &&
                        is->frame_last_dropped_pts > is->frame_last_pts) {
                    wnd->update_video_pts(is->frame_last_dropped_pts,
                                          is->frame_last_dropped_pos,
                                          is->frame_last_dropped_serial);

                    is->frame_last_dropped_pts = AV_NOPTS_VALUE;
                }
                wnd->pictq_mutex->unlock();

                // nothing to do, no picture to display in the queue
            }
            else
            {
                double last_duration, duration, delay;
                /* dequeue the picture */
                vp = &is->pictq[is->pictq_rindex];

                if (vp->serial != is->videoq.serial) {
                    wnd->pictq_next_picture();
                    redisplay = 0;
                    continue;
                }

                if (!is->paused)
                {
                    /* compute nominal last_duration */
                    last_duration = vp->pts - is->frame_last_pts;
                    if (!isnan(last_duration) && last_duration > 0 &&
                            last_duration < is->max_frame_duration) {

                        /* if duration of the last frame was sane, update last_duration in video state */
                        is->frame_last_duration = last_duration;
                    }

                    if (redisplay)
                        delay = 0.0;
                    else
                        delay = wnd->compute_target_delay(is->frame_last_duration);

                    time= av_gettime()/1000000.0;
                    if (time < is->frame_timer + delay && !redisplay) {
                        *remaining_time = FFMIN(is->frame_timer + delay - time, *remaining_time);
                        return;
                    }

                    is->frame_timer += delay;
                    if (delay > 0 && time - is->frame_timer > AV_SYNC_THRESHOLD_MAX)
                        is->frame_timer = time;

                    wnd->pictq_mutex->lock();
                    if (!redisplay && !isnan(vp->pts))
                        wnd->update_video_pts( vp->pts, vp->pos, vp->serial);
                    wnd->pictq_mutex->unlock();

                    if (is->pictq_size > 1)
                    {

                        VideoPicture *nextvp = &is->pictq[(is->pictq_rindex + 1) % VIDEO_PICTURE_QUEUE_SIZE];
                        duration = nextvp->pts - vp->pts;

                        if(!is->step && (redisplay || wnd->framedrop>0 ||
                                         (wnd->framedrop && wnd->get_master_sync_type() != AV_SYNC_VIDEO_MASTER)  )
                                          && time > is->frame_timer + duration)
                        {
                            if (!redisplay)
                                is->frame_drops_late++;
                            wnd->pictq_next_picture();
                            redisplay = 0;
                            continue;
                        }
                    }
                }
                /* display picture */
                if (!wnd->display_disable && is->show_mode == VideoState::SHOW_MODE_VIDEO)
                    wnd->video_display();

                wnd-> pictq_next_picture();

                if (is->step && !is->paused)
                    wnd->stream_toggle_pause();
            }

            break;
        }

    }
    is->force_refresh = 0;

    if (wnd->show_status)
    {
        static int64_t last_time;
        int64_t cur_time;

        cur_time = av_gettime();
        if (!last_time || (cur_time - last_time) >= 30000) {

            last_time = cur_time;
        }
    }
}


int sc_player::queue_picture( AVFrame *src_frame,
                                  double pts,
                                  int64_t pos,
                                  int serial)
{
    VideoPicture *vp;
    sc_decoder *x_decoder = this->x_decoder;

 #if defined(DEBUG_SYNC) && 0
     printf("frame_type=%c pts=%0.3f\n",
            av_get_picture_type_char(src_frame->pict_type), pts);
 #endif

     /* wait until we have space to put a new picture */
     pictq_mutex->lock();

     /* keep the last already displayed picture in the queue */
     while (is->pictq_size >= VIDEO_PICTURE_QUEUE_SIZE - 1 &&
            !is->videoq.abort_request) {
         pictq_cond->wait(pictq_mutex);
     }
     pictq_mutex->unlock();

     if (is->videoq.abort_request)
         return -1;

     vp = &is->pictq[is->pictq_windex];

     vp->sar = src_frame->sample_aspect_ratio;

     /* alloc or resize hardware picture buffer */
     if (!vp->pFrameRGB || vp->reallocate || !vp->allocated ||
         vp->width  != src_frame->width ||
         vp->height != src_frame->height) {

         vp->allocated  = 0;
         vp->reallocate = 0;
        vp->width = src_frame->width;
        vp->height = src_frame->height;
        vp->width = 1024;
        vp->height = 516;

         /* the allocation must be done in the main thread to avoid
            locking problems. */

        sc_qt_player *qt_player = (sc_qt_player*) this ;
        qt_player->alloc_picture( qt_player );

         if (is->videoq.abort_request)
             return -1;
     }

     /* if the frame is not skipped, then display it */
     if (vp->pFrameRGB) {

#if CONFIG_AVFILTER
            // FIXME use direct rendering
            av_picture_copy((AVPicture*)&vp->pFrameRGB, (AVPicture *)src_frame,
                            (AVPixelFormat)src_frame->format, vp->width, vp->height);

#else

         if (is->img_convert_ctx == NULL ) {
             av_opt_get_int(sc_sws_opts, "sws_flags", 0, &sws_flags);
             is->img_convert_ctx =sws_getCachedContext(is->img_convert_ctx,
                                               x_decoder->pCodecCtx->width,
                                               x_decoder->pCodecCtx->height,
                                               x_decoder->pCodecCtx->pix_fmt,
                                               vp->width,  vp->height,
                                               (AVPixelFormat)PIX_FMT_RGB24,
                                                sws_flags,NULL, NULL, NULL );
             if (is->img_convert_ctx == NULL) {
                 throw sc_exception( ERR_SC_PLAYER );
             }
         }
         sc_log( vp->pFrameRGB->data );
        sws_scale(is->img_convert_ctx,src_frame->data,
               src_frame->linesize, 0,
               is->video_st->codec->height, vp->pFrameRGB->data,
               vp->pFrameRGB->linesize);

        vp->pFrameRGB->width = vp->width;
        vp->pFrameRGB->height = vp->height;

#endif

        vp->sample_aspect_ratio =av_guess_sample_aspect_ratio(is->ic,
            is->video_st, src_frame);

         vp->pts = pts;
         vp->pos = pos;
         vp->serial = serial;

         /* now we can update the picture count */
         if (++is->pictq_windex == VIDEO_PICTURE_QUEUE_SIZE)
             is->pictq_windex = 0;
         pictq_mutex->lock();
         is->pictq_size++;         
         pictq_mutex->unlock();
     }
     return 0;
}


int sc_player::video_thread(void *arg)
{

    AVPacket pkt;
    memset( (void*)&pkt, 0, sizeof(AVPacket));
    sc_player *screen = (sc_player *)arg;
    sc_decoder *x_decoder = screen->x_decoder;
    VideoState *is = screen->is;
    AVFrame *frame = av_frame_alloc();


    double pts;
    int ret;
    int serial = 0;

    try {
    for (;;) {
        while (is->paused && !is->videoq.abort_request)
            QThread::msleep(10);

        avcodec_get_frame_defaults(frame);
        av_free_packet(&pkt);


        ret = x_decoder->get_video_frame( frame, &pkt, &serial);


        if( ret < 0 )throw sc_exception( ret );

        if (!ret)
            continue;

        pts = (frame->pts == AV_NOPTS_VALUE) ? NAN : frame->pts * av_q2d(is->video_st->time_base);
        ret = screen->queue_picture( frame, pts, pkt.pos, serial);
 ///XXX       av_frame_unref(frame);

        if( ret < 0 ) throw sc_exception( ret );

    }
    }
    catch ( sc_exception &e )
    {
        avcodec_flush_buffers(is->video_st->codec);
        av_free_packet(&pkt);
        av_frame_free(&frame);
    }
    return 0;
}



/* copy samples for viewing in editor window */
void sc_player::update_sample_display( short *samples, int samples_size)
{
    int size, len;

    size = samples_size / sizeof(short);
    while (size > 0) {
        len = SAMPLE_ARRAY_SIZE - is->sample_array_index;
        if (len > size)
            len = size;
        memcpy(is->sample_array + is->sample_array_index, samples, len * sizeof(short));
        samples += len;
        is->sample_array_index += len;
        if (is->sample_array_index >= SAMPLE_ARRAY_SIZE)
            is->sample_array_index = 0;
        size -= len;
    }
}

int sc_player::is_realtime(AVFormatContext *s)
{
    if(   !strcmp(s->iformat->name, "rtp")
       || !strcmp(s->iformat->name, "rtsp")
       || !strcmp(s->iformat->name, "sdp")
    )
        return 1;

    if(s->pb && (   !strncmp(s->filename, "rtp:", 4)
                 || !strncmp(s->filename, "udp:", 4)
                )
    )
        return 1;
    return 0;
}


/* seek in the stream */
void sc_player::stream_seek( int64_t pos, int64_t rel, int seek_by_bytes)
{
    if (!is->seek_req) {
        is->seek_pos = pos;
        is->seek_rel = rel;
        is->seek_flags &= ~AVSEEK_FLAG_BYTE;
        if (seek_by_bytes)
            is->seek_flags |= AVSEEK_FLAG_BYTE;
        is->seek_req = 1;
        wc_read_thread->wakeOne();
    }
}


/* pause or resume the video */
void sc_player::stream_toggle_pause()
{
    if (is->paused) {
        is->frame_timer += av_gettime() / 1000000.0 + is->vidclk.pts_drift - is->vidclk.pts;
        if (is->read_pause_return != AVERROR(ENOSYS)) {
            is->vidclk.paused = 0;
        }
        set_clock(&is->vidclk, get_clock(&is->vidclk), is->vidclk.serial);
    }
    set_clock(&is->extclk, get_clock(&is->extclk), is->extclk.serial);
    is->paused = is->audclk.paused = is->vidclk.paused = is->extclk.paused = !is->paused;
}

void sc_player::toggle_pause()
{
    stream_toggle_pause();
    is->step = 0;
}

void sc_player::start()
{
}


int sc_player::play()
{
}

void SaveFrame(AVFrame *pFrame, int width, int height, int iFrame) {
  FILE *pFile;
  char szFilename[32];
  int  y;

  // Open file
  sprintf(szFilename, "frame%d.ppm", iFrame);
  pFile=fopen(szFilename, "wb");
  if(pFile==NULL)
    return;

  // Write header
  fprintf(pFile, "P6\n%d %d\n255\n", width, height);

  // Write pixel data
  for(y=0; y<height; y++)
    fwrite(pFrame->data[0]+y*pFrame->linesize[0], 1, width*3, pFile);

  // Close file
  fclose(pFile);
}


sc_player::~sc_player()
{
   delete  wc_read_thread;
    av_free( is );
    delete pictq_mutex;
    delete pictq_cond;
    delete p_video_thread;
    delete p_read_thread;
    if( x_decoder)
        delete x_decoder;
}
