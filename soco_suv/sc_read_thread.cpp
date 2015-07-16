
#include "miss_def.h"
#include "config.h"

#include <boost/scoped_ptr.hpp>
using namespace boost;

#include <QMutex>
#include <QWaitCondition>

#include "sc_qt_player.h"

#include "sc_exception.h"
#include "sc_decoder.h"

#include "sc_read_thread.h"

#define ERR_SC_READ_THREAD -7

sc_read_thread::sc_read_thread(QObject *parent) :
    QThread(parent)
{
    x_player = 0;

}


void sc_read_thread::set_arg( sc_qt_player * plr )
{
    x_player = plr;
}

void sc_read_thread::run()
{

    while( x_player == 0 )
    {
        QThread::msleep( 20 );
    }

    if( x_player )
    {

    sc_decoder *x_decoder = x_player->x_decoder;
    VideoState * is = x_decoder->is;
    AVFormatContext *ic = x_decoder->pFormatCtx;

    AVPacket pkt1, *pkt = &pkt1;
    int eof = 0;
    int ret;
    int64_t stream_start_time;
    int pkt_in_play_range = 0;

    QMutex * wait_mutex = new QMutex( QMutex::NonRecursive );
    scoped_ptr< QMutex> sp_wait_mutex( wait_mutex );

    if( !x_player->video_disable )
        ret = x_decoder->stream_component_open(AVMEDIA_TYPE_VIDEO);

    if (x_player->infinite_buffer < 0 && is->realtime)
        x_player->infinite_buffer = 1;

    try{
        while( x_player->display_disable == 0 ) {
            if (is->abort_request)
                break;
            if (is->paused != is->last_paused) {
                is->last_paused = is->paused;
                if (is->paused)
                    is->read_pause_return = av_read_pause(ic);
                else
                    av_read_play(ic);
            }
    #if CONFIG_RTSP_DEMUXER || CONFIG_MMSH_PROTOCOL
            if (is->paused &&
                    (!strcmp(ic->iformat->name, "rtsp") ||
                     (ic->pb && !strncmp(x_decoder->st_name.c_str(), "mmsh:", 5)))) {
                /* wait 10 ms to avoid trying to get another packet */
                /* XXX: horrible */
                QThread::msleep(10);

                continue;
            }

            if (is->seek_req) {
                int64_t seek_target = is->seek_pos;
                int64_t seek_min    = is->seek_rel > 0 ? seek_target - is->seek_rel + 2: INT64_MIN;
                int64_t seek_max    = is->seek_rel < 0 ? seek_target - is->seek_rel - 2: INT64_MAX;
    // FIXME the +-2 is due to rounding being not done in the correct direction in generation
    //      of the seek_pos/seek_rel variables

                ret = avformat_seek_file(is->ic, -1, seek_min, seek_target, seek_max, is->seek_flags);
                if (ret < 0) {
                    av_log(NULL, AV_LOG_ERROR,
                           "%s: error while seeking\n", is->ic->filename);
                } else {

                    if (is->video_stream >= 0) {
                        x_decoder->packet_queue_flush(&is->videoq);
                        x_decoder->packet_queue_put(&is->videoq, &sc_qt_player::flush_pkt);
                    }
                    if (is->seek_flags & AVSEEK_FLAG_BYTE) {
                       x_player->set_clock(&is->extclk, NAN, 0);
                    } else {
                       x_player->set_clock(&is->extclk, seek_target / (double)AV_TIME_BASE, 0);
                    }
                }
                is->seek_req = 0;
                is->queue_attachments_req = 1;
                eof = 0;
                if (is->paused)
                    x_player->step_to_next_frame();
            }
            if (is->queue_attachments_req) {
                if (is->video_st && is->video_st->disposition & AV_DISPOSITION_ATTACHED_PIC) {
                    AVPacket copy;
                    if ((ret = av_copy_packet(&copy, &is->video_st->attached_pic)) < 0)
                        throw sc_exception( ERR_SC_READ_THREAD );
                    x_decoder->packet_queue_put(&is->videoq, &copy);
                    x_decoder->packet_queue_put_nullpacket(&is->videoq, is->video_stream);
                }
                is->queue_attachments_req = 0;
            }

            /* if the queue are full, no need to read more */
            if ( x_player->infinite_buffer<1 && ( is->videoq.size  > MAX_QUEUE_SIZE ) ) {

                /* wait 10 ms */
                wait_mutex->lock();
                x_player->wc_read_thread->wait( wait_mutex, 10);
                wait_mutex->unlock();

                continue;
            }
            if (!is->paused &&
                    (!is->video_st || (is->video_finished == is->videoq.serial && is->pictq_size == 0)))
            {
                if (x_player->loop != 1 && (!x_player->loop || --x_player->loop))
                {
                    x_player->stream_seek( x_player->start_time != AV_NOPTS_VALUE ? x_player->start_time : 0, 0, 0);
                }
                else if (x_player-> autoexit) {
                    throw sc_exception( ERR_SC_READ_THREAD );
                }
            }
            if (eof) {
                if (is->video_stream >= 0)
                    x_decoder->packet_queue_put_nullpacket(&is->videoq, is->video_stream);

                QThread::msleep(10);
                eof=0;
                continue;
            }
            ret = av_read_frame(ic, pkt);
            if (ret < 0) {
                if (ret == AVERROR_EOF || url_feof(ic->pb))
                    eof = 1;
                if (ic->pb && ic->pb->error)
                    break;

                wait_mutex->lock();
                x_player->wc_read_thread->wait(wait_mutex, 10);
                wait_mutex->unlock();
                continue;
            }
            /* check if packet is in play range specified by user, then queue, otherwise discard */
            stream_start_time = ic->streams[pkt->stream_index]->start_time;
            pkt_in_play_range =
                    x_player->duration == AV_NOPTS_VALUE ||
                    (pkt->pts - (stream_start_time != AV_NOPTS_VALUE ? stream_start_time : 0)) *
                    av_q2d(ic->streams[pkt->stream_index]->time_base) -
                    (double)(x_player->start_time != AV_NOPTS_VALUE ? x_player->start_time : 0) / 1000000
                    <= ((double)x_player->duration / 1000000);

            if (pkt->stream_index == is->video_stream &&
                    pkt_in_play_range  &&
                    !(is->video_st->disposition & AV_DISPOSITION_ATTACHED_PIC))
            {
                x_decoder->packet_queue_put(&is->videoq, pkt);
            }
            else
            {
                av_free_packet(pkt);
            }
        }
        /* wait until the end */
        while (!is->abort_request) {
            QThread::msleep(100);
        }

        ret = 0;
    }
    catch( sc_exception &e )
    {
    }
    }
#endif

}

