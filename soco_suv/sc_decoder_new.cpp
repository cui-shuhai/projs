extern "C" {

#include "config.h"
#include "libavdevice/avdevice.h"
#include "libavfilter/avfilter.h"
#include "libavformat/avformat.h"

}

#include <boost/scoped_ptr.hpp>
#include <boost/shared_ptr.hpp>
using namespace boost;

#include <QMutex>
#include <QWaitCondition>

#include "sc_helper.h"
#include "sc_exception.h"
#include "sc_decoder.h"
#include "sc_qt_player.h"
#include "sc_read_thread.h"
#include "sc_video_thread.h"

#define INT64_MIN (-9223372036854775807LL-1)
#define INT64_MAX (9223372036854775807LL)
#define ERR_SC_DECODER -5

struct SwsContext *sc_sws_opts;
extern AVDictionary* sc_format_opts;
extern AVDictionary* sc_codec_opts;
extern AVDictionary* sc_resample_opts;



//since all the channels shoul be the same format, no need to allocate
// an array for each channel
AVDictionary * sc_iformat_opts = 0;
AVInputFormat * 	sc_ifmt;
AVDictionary *sc_format_opts, *sc_codec_opts, *sc_resample_opts;

AVDictionary *filter_codec_opts(AVDictionary *opts,
                                enum AVCodecID codec_id,
                                AVFormatContext *s,
                                AVStream *st,
                                AVCodec *codec);



/* constructor - iniitalizes all variabe scope variable */
sc_decoder::sc_decoder( sc_qt_player *plr )
    : player( plr )
    , pFrame( 0 )
    , pFrameRGB( 0 )
    , buffer( 0 )
    , numBytes( 0 )
    , frameFinished( 0 )
    , abort_request( 0 )
    , is( plr->is )
    , video_codec_name( "")
    ,  decoder_reorder_pts( -1)
    ,  genpts( 0)
    , st_name("")
    , pktq_mutex( new QMutex )
    , pktq_cond( new QWaitCondition )
{
    src = "";
    soco_avinit();

    pFormatCtx = avformat_alloc_context();
    video_stream_index = -1;
    pFormatCtx->interrupt_callback.callback = sc_decoder::decode_interrupt_cb;
    pFormatCtx->interrupt_callback.opaque = this;
    sp_pktq_mutex = shared_ptr< QMutex >( pktq_mutex);
}

sc_decoder::~sc_decoder()
{

    avcodec_close(pCodecCtx);

    av_free(pCodecCtx);

    // Close the video file
     avformat_close_input	( &pFormatCtx);
     avformat_free_context( pFormatCtx );
}


void sc_decoder::soco_avinit()
{
    static bool initialize = false;
    if( initialize == false )
    {
        av_log_set_flags(AV_LOG_SKIP_REPEATED);

        /* register all codecs, demux and protocols */
        avcodec_register_all();

        #if CONFIG_AVDEVICE
            avdevice_register_all();
        #endif
        #if CONFIG_AVFILTER
            avfilter_register_all();
        #endif

        av_register_all();
        avformat_network_init();

        sc_decoder::init_opts();

        initialize = true;
    }
}



void sc_decoder::init_opts(void)
{

    if(CONFIG_SWSCALE)
        sc_sws_opts = sws_getContext(16, 16, (AVPixelFormat)0,
                                  16, 16,(AVPixelFormat) 0,
                                  SWS_BICUBIC,
                                   NULL, NULL, NULL);
}

void sc_decoder::uninit_opts(void)
{
#if CONFIG_SWSCALE
    sws_freeContext(sc_sws_opts);
    sc_sws_opts = NULL;
#endif

    av_dict_free(&sc_format_opts);
    av_dict_free(&sc_codec_opts);
    av_dict_free(&sc_resample_opts);
}


int sc_decoder::sc_open( string url)
{

    src = url;
    int rc = 0, i, ret;
    VideoState *is = player->is;

    //1. setup decoder
     AVDictionary **opts;
     AVDictionaryEntry *t;
     int orig_nb_streams;

     sc_log( url );
    rc = avformat_open_input( &pFormatCtx, url.c_str(), sc_ifmt, &sc_format_opts);

     if( rc < 0 ) throw sc_exception( rc );

     is->ic = pFormatCtx;
     is->iformat = sc_ifmt;

    if ( (t = av_dict_get(sc_format_opts, "", NULL, AV_DICT_IGNORE_SUFFIX))) {
      av_log(NULL, AV_LOG_ERROR, "Option %s not found.\n", t->key);
      rc = AVERROR_OPTION_NOT_FOUND;     }

    if (genpts)
        pFormatCtx->flags |= AVFMT_FLAG_GENPTS;

    opts = setup_find_stream_info_opts(pFormatCtx, sc_codec_opts);
    orig_nb_streams = pFormatCtx->nb_streams;

    rc = avformat_find_stream_info(pFormatCtx, opts);
    if (rc < 0) throw sc_exception( rc );

    for (i = 0; i < orig_nb_streams; i++)
        av_dict_free(&opts[i]);
    av_freep(&opts);

     if( pFormatCtx->pb )
     {
         pFormatCtx->pb->eof_reached = 0;
     }

     if (player->seek_by_bytes < 0)
         player->seek_by_bytes = !!(pFormatCtx->iformat->flags & AVFMT_TS_DISCONT)
                 && strcmp("ogg", pFormatCtx->iformat->name);

     is->max_frame_duration = (pFormatCtx->iformat->flags & AVFMT_TS_DISCONT) ? 10.0 : 3600.0;

     /* if seeking requested, we execute it */
     if (player->start_time != AV_NOPTS_VALUE) {
         int64_t timestamp;

         timestamp = player->start_time;
         /* add the stream start time */
         if (pFormatCtx->start_time != AV_NOPTS_VALUE)
             timestamp += pFormatCtx->start_time;
         ret = avformat_seek_file(pFormatCtx, -1, INT64_MIN, timestamp, INT64_MAX, 0);
         if (ret < 0) {
             av_log(NULL, AV_LOG_WARNING, "%s: could not seek to position %0.3f\n",
                     is->filename, (double)timestamp / AV_TIME_BASE);
         }
     }

      is->realtime = player->is_realtime(pFormatCtx);


     // find first vidwo stream index
     for(i=0; i<pFormatCtx->nb_streams; i++)
     {
         if(pFormatCtx->streams[i]->codec->codec_type == AVMEDIA_TYPE_VIDEO)
         {
             video_stream_index = i ;
             break;
         }
     }

     if( video_stream_index == -1)throw sc_exception( video_stream_index );

     if( player->show_status )
     {
         /// Dump information about file onto standard error
         av_dump_format(pFormatCtx, 0,url.c_str(), 0);
     }

     /* find video decoder */
     // Get a pointer to the codec context for the video stream
     pCodecCtx = pFormatCtx->streams[video_stream_index]->codec;

     // Find the decoder for the video stream
     pCodec=avcodec_find_decoder(pCodecCtx->codec_id);

     if( !pCodec )
     {
         sc_log( pCodec );
         throw sc_exception(  -1 );
     }

     /// Open codec
     if( avcodec_open2(pCodecCtx, pCodec, NULL) < 0 )
     {
         sc_log( __LINE__ );
         throw sc_exception( -1 );
     }

     // Allocate video frame
     pFrame=avcodec_alloc_frame();

     if( !pFrame )
     {
         sc_log( pFrame );
         throw sc_exception( ERR_SC_DECODER );
     }

     avcodec_get_frame_defaults( pFrame );

     is->video_stream = video_stream_index;

     is->video_st = pFormatCtx->streams[is->video_stream];

     is->last_video_stream =  video_stream_index;

     stream_open();
}

int sc_decoder::sc_read_packet( AVPacket *pPkt )
{
    return av_read_frame(  pFormatCtx, pPkt );
}

/* read RGB frame */
int sc_decoder::sc_read( AVFrame **ppF  )
{

    static AVPacket packet;
    static int      bytesRemaining=0;
    static uint8_t  *rawData;
    static bool     fFirstTime=true;
    int             bytesDecoded;
    bool   out_loop = true;

     // Decode packets until we have decoded a complete frame
    while(out_loop)
    {
        // Work on the current packet until we have decoded all of it
        while(bytesRemaining > 0)
        {
            // Decode the next chunk of data
            bytesDecoded = avcodec_decode_video2(pCodecCtx, pFrame,
              (int*)rawData, &packet );

            // Was there an error?
            if(bytesDecoded < 0)
            {
                fprintf(stderr, "Error while decoding frame\n");
                return false;
            }

            bytesRemaining-=bytesDecoded;
            rawData+=bytesDecoded;

            // Did we finish the current frame? Then we can return
            if(frameFinished)
                return true;
        }

        // Read the next packet, skipping all packets that aren't for this
        // stream
        do
        {
            // Free old packet
            if(packet.data!=NULL)
                av_free_packet(&packet);

            // Read new packet
            if(av_read_frame(pFormatCtx, &packet)<0)
            {
                out_loop = false;
                break;
            }
        } while(packet.stream_index!=video_stream_index);

        if( out_loop )
        {
            bytesRemaining=packet.size;
            rawData=packet.data;
        }
    }

    // Decode the rest of the last frame
    bytesDecoded=avcodec_decode_video2(pCodecCtx, pFrame, (int*)rawData, &packet );

    *ppF = pFrameRGB;

    // Free last packet
    if(packet.data!=NULL)
        av_free_packet(&packet);

    return  ( frameFinished != 0 );

}

/* check if there are more packets, we assume if the media open success, there is at lease one */
int sc_decoder::sc_has_more()
{
    return frameFinished != 0;
}

int sc_decoder::sc_close()
{
    delete [] buffer;
    av_free(pFrameRGB);

    // Free the YUV frame
    av_free(pFrame);
    avformat_close_input(&pFormatCtx);
}

int sc_decoder::decode_interrupt_cb(void *ctx)
{
    sc_decoder *is =(sc_decoder *) ctx;

    //sc_log( is->abort_request );
    return is->abort_request;
}

int sc_decoder::get_video_frame( AVFrame *frame, AVPacket *pkt, int *serial)
{
    int got_picture;


    if (packet_queue_get(&is->videoq, pkt, 1, serial) < 0)
        return -1;

    sc_log( serial );
    sc_log( pkt->size );

    if (pkt->data == sc_qt_player::flush_pkt.data) {
        avcodec_flush_buffers(is->video_st->codec);
        player->pictq_mutex->lock();

        // Make sure there are no long delay timers (ideally we should just flush the queue but that's harder)
        while (is->pictq_size && !is->videoq.abort_request)
        {
            player->pictq_cond->wait( player->pictq_mutex );
        }

        is->video_current_pos = -1;
        is->frame_last_pts = AV_NOPTS_VALUE;
        is->frame_last_duration = 0;
        is->frame_timer = (double)av_gettime() / 1000000.0;
        is->frame_last_dropped_pts = AV_NOPTS_VALUE;
        player->pictq_mutex->unlock();
        return 0;
    }


    if(avcodec_decode_video2(is->video_st->codec, frame, &got_picture, pkt) < 0)
    {
        sc_log( ERR_SC_DECODER );
        return 0;
    }

    if (!got_picture && !pkt->data)
        is->video_finished = *serial;

    if (got_picture) {
        int ret = 1;
        double dpts = NAN;

        if (decoder_reorder_pts == -1) {

            frame->pts = av_frame_get_best_effort_timestamp(frame);

        } else if (decoder_reorder_pts) {
            frame->pts = frame->pkt_pts;
        } else {
            frame->pts = frame->pkt_dts;
        }

        if(((unsigned int64_t) frame->pts) != AV_NOPTS_VALUE )
        {
            dpts = av_q2d(is->video_st->time_base) * frame->pts ;
        }

        frame->sample_aspect_ratio = av_guess_sample_aspect_ratio(is->ic, is->video_st, frame);

        if (player->framedrop>0 || (player->framedrop && player->get_master_sync_type() != AV_SYNC_VIDEO_MASTER)) {

            player->pictq_mutex->lock();
            if (is->frame_last_pts != AV_NOPTS_VALUE && frame->pts != AV_NOPTS_VALUE)
            {
                double clockdiff = player->get_clock(&is->vidclk) - player->get_master_clock();
                double ptsdiff = dpts - is->frame_last_pts;
                if (!isnan(clockdiff) && fabs(clockdiff) < AV_NOSYNC_THRESHOLD &&
                    !isnan(ptsdiff) && ptsdiff > 0 && ptsdiff < AV_NOSYNC_THRESHOLD &&
                    clockdiff + ptsdiff - is->frame_last_filter_delay < 0 &&
                    is->videoq.nb_packets) {
                    is->frame_last_dropped_pos = pkt->pos;
                    is->frame_last_dropped_pts = dpts;
                    is->frame_last_dropped_serial = *serial;
                    is->frame_drops_early++;
                    av_frame_unref(frame);
                    ret = 0;
                }
            }
            player->pictq_mutex->unlock();
        }

        return ret;
    }

    return 0;
}


void sc_decoder::stream_open()
{
    av_strlcpy(is->filename, this->src.c_str(), sizeof(is->filename));
    is->iformat = sc_ifmt;
    is->ytop    = 0;
    is->xleft   = 0;

    /* start video display */

    packet_queue_init(&is->videoq);

    player->init_clock(&is->vidclk, &is->videoq.serial);
    player->init_clock(&is->extclk, &is->extclk.serial);
    is->av_sync_type = player->av_sync_type;
    int ret = -1;

    string read_thread_name = st_name + "read thread";
     player->p_read_thread->start();
}


int sc_decoder::packet_queue_put(PacketQueue *q, AVPacket *pkt)
{
    int ret;

    /* duplicate the packet */
    if (pkt != &sc_qt_player::flush_pkt && av_dup_packet(pkt) < 0)
        return -1;

    pktq_mutex->lock();
    ret = packet_queue_put_private(q, pkt);
    pktq_mutex->unlock();

    if (pkt != &sc_qt_player::flush_pkt && ret < 0)
        av_free_packet(pkt);

    return ret;
}

int sc_decoder::packet_queue_put_private(PacketQueue *q, AVPacket *pkt)
{
    MyAVPacketList *pkt1;

    if (q->abort_request)
       return -1;

    pkt1 = (MyAVPacketList*) av_malloc(sizeof(MyAVPacketList));
    if (!pkt1)
        return -1;
    pkt1->pkt = *pkt;
    pkt1->next = NULL;
    if (pkt == &sc_qt_player::flush_pkt)
        q->serial++;
    pkt1->serial = q->serial;

    if (!q->last_pkt)
        q->first_pkt = pkt1;
    else
        q->last_pkt->next = pkt1;
    q->last_pkt = pkt1;
    q->nb_packets++;


    q->size += pkt1->pkt.size + sizeof(*pkt1);
    /* XXX: should duplicate packet data in DV case */
    pktq_cond->wakeOne();
    return 0;
}

int sc_decoder::packet_queue_put_nullpacket(PacketQueue *q, int stream_index)
{
    AVPacket pkt1, *pkt = &pkt1;
    av_init_packet(pkt);
    pkt->data = NULL;
    pkt->size = 0;
    pkt->stream_index = stream_index;
    return packet_queue_put(q, pkt);
}

/* packet queue handling */
void sc_decoder::packet_queue_init(PacketQueue *q)
{
    memset(q, 0, sizeof(PacketQueue));
    q->abort_request = 0; // origional 1;

    sc_log( q->abort_request );
}

void sc_decoder::packet_queue_flush(PacketQueue *q)
{
    MyAVPacketList *pkt, *pkt1;

    pktq_mutex->lock();
    for (pkt = q->first_pkt; pkt != NULL; pkt = pkt1) {
        pkt1 = pkt->next;
        av_free_packet(&pkt->pkt);
        av_freep(&pkt);
    }
    q->last_pkt = NULL;
    q->first_pkt = NULL;
    q->nb_packets = 0;
    q->size = 0;
    pktq_mutex->unlock();
}

void sc_decoder::packet_queue_destroy(PacketQueue *q)
{
    packet_queue_flush(q);
}

void sc_decoder::packet_queue_abort(PacketQueue *q)
{
    pktq_mutex->lock();

    q->abort_request = 1;

    pktq_cond->wakeOne();

    pktq_mutex->unlock();
}

void sc_decoder::packet_queue_start(PacketQueue *q)
{
    pktq_mutex->lock();
    q->abort_request = 0;
    packet_queue_put_private(q, &sc_qt_player::flush_pkt);
    pktq_mutex->unlock();
}

/* return < 0 if aborted, 0 if no packet and > 0 if packet.  */
int sc_decoder::packet_queue_get(PacketQueue *q, AVPacket *pkt,
                                    int block, int *serial)
{
    MyAVPacketList *pkt1;
    int ret;

    pktq_mutex->lock();

    for (;;) {
        if (q->abort_request) {
            ret = -1;
            break;
        }

        pkt1 = q->first_pkt;

        if (pkt1) {
            q->first_pkt = pkt1->next;
            if (!q->first_pkt)
                q->last_pkt = NULL;
            q->nb_packets--;
            q->size -= pkt1->pkt.size + sizeof(*pkt1);
            *pkt = pkt1->pkt;

            if (serial)
                *serial = pkt1->serial;
            av_free(pkt1);
            ret = 1;
            break;
        } else if (!block) {
            ret = 0;
            break;
        } else {

            pktq_cond->wait( pktq_mutex);
        }
    }
    pktq_mutex->unlock();
    return ret;
}

/* open a given stream. Return 0 if OK */
int sc_decoder::stream_component_open( int stream_index)
{
    AVFormatContext *ic = is->ic;
    AVCodecContext *avctx = pCodecCtx;
    AVCodec *codec = 0;
    const char *forced_codec_name = NULL;
    AVDictionary *opts = sc_format_opts;
    AVDictionaryEntry *t = NULL;
    int sample_rate, nb_channels;
    int64_t channel_layout;
    int ret;
    int stream_lowres = player->lowres;

    if (stream_index < 0 || stream_index >= ic->nb_streams)
        return -1;

    codec = pCodec;

    avctx = ic->streams[stream_index]->codec = pCodecCtx;

    switch(avctx->codec_type){
         case AVMEDIA_TYPE_VIDEO   :
            is->last_video_stream    = stream_index;
            forced_codec_name =    video_codec_name.c_str();
            break;
    }

    avctx->codec_id = codec->id;
    avctx->workaround_bugs   = player-> workaround_bugs;
    if(stream_lowres > av_codec_get_max_lowres(codec)){
        av_log(avctx, AV_LOG_WARNING, "The maximum value for lowres supported by the decoder is %d\n",
                av_codec_get_max_lowres(codec));
        stream_lowres = av_codec_get_max_lowres(codec);
    }
    av_codec_set_lowres(avctx, stream_lowres);
    avctx->error_concealment = player->error_concealment;

    if(stream_lowres) avctx->flags |= CODEC_FLAG_EMU_EDGE;
    if (player->fast)   avctx->flags2 |= CODEC_FLAG2_FAST;
    if(codec->capabilities & CODEC_CAP_DR1)
        avctx->flags |= CODEC_FLAG_EMU_EDGE;

    opts = filter_codec_opts(sc_codec_opts, avctx->codec_id, ic, ic->streams[stream_index], codec);
    if (!av_dict_get(opts, "threads", NULL, 0))
        av_dict_set(&opts, "threads", "auto", 0);
    if (stream_lowres)
        av_dict_set(&opts, "lowres", av_asprintf("%d", stream_lowres), AV_DICT_DONT_STRDUP_VAL);
    if (avctx->codec_type == AVMEDIA_TYPE_VIDEO || avctx->codec_type == AVMEDIA_TYPE_AUDIO)
        av_dict_set(&opts, "refcounted_frames", "1", 0);
    if (avcodec_open2(avctx, codec, &opts) < 0)
        return -1;
    // not working
    if ((t = av_dict_get(sc_format_opts, "", NULL, AV_DICT_IGNORE_SUFFIX))) {
        av_log(NULL, AV_LOG_ERROR, "Option %s not found.\n", t->key);
        return AVERROR_OPTION_NOT_FOUND;
    }

    ic->streams[stream_index]->discard = AVDISCARD_DEFAULT;
    switch (avctx->codec_type) {
    case AVMEDIA_TYPE_AUDIO:
        break;
    case AVMEDIA_TYPE_VIDEO:
        is->video_stream = stream_index;
        is->video_st = ic->streams[stream_index];

        packet_queue_start(&is->videoq);
        player->p_video_thread->start();
        is->queue_attachments_req = 1;
        break;
    case AVMEDIA_TYPE_SUBTITLE:
        break;
    default:
        break;
    }
    return 0;
}



void sc_decoder::stream_close()
{
    VideoPicture *vp;
    int i;
    /* XXX: use a special url_shutdown call to abort parse cleanly */
    is->abort_request = 1;
    packet_queue_destroy(&is->videoq);

    /* free all pictures */
    for (i = 0; i < VIDEO_PICTURE_QUEUE_SIZE; i++) {
        vp = &is->pictq[i];
        if (vp->pFrameRGB) {
              av_free(vp->pFrameRGB);
              vp->pFrameRGB = 0;
          }
          if (vp->buffer) {
              av_free(vp->buffer);
              vp->buffer = 0;
          }
}


#if !CONFIG_AVFILTER
    sws_freeContext(is->img_convert_ctx);
#endif
   //  av_free(is);
}
