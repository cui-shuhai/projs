
#include "config.h"

#include "sc_exception.h"

#include "sc_video_thread.h"
#include "sc_qt_player.h"

sc_video_thread::sc_video_thread(QObject *parent) :
    QThread(parent)
{
    x_player = 0;

}

void sc_video_thread::set_arg( sc_qt_player * plr )
{
    x_player = plr;
}

void sc_video_thread::run()
{
    while( x_player == 0 )
    {
        QThread::msleep( 20 );
    }

    if( x_player)
    {

        AVPacket pkt;
        memset( (void*)&pkt, 0, sizeof(AVPacket));
        sc_decoder *x_decoder = x_player->x_decoder;
        VideoState *is = x_player->is;
        AVFrame *frame = av_frame_alloc();


        double pts;
        int ret;
        int serial = 0;
    try
    {

        for (;x_player->display_disable == 0;)
    {
        while (is->paused && !is->videoq.abort_request)
            QThread::msleep(10);


        avcodec_get_frame_defaults(frame);
        av_free_packet(&pkt);


        ret = x_decoder->get_video_frame( frame, &pkt, &serial);

        sc_log( serial )

        if( ret < 0 )throw sc_exception( ret );

        if (!ret)
            continue;

        pts = (frame->pts == AV_NOPTS_VALUE) ? NAN : frame->pts * av_q2d(is->video_st->time_base);
        ret = x_player->queue_picture( frame, pts, pkt.pos, serial);
 ///XXX     av_frame_unref(frame);

        if( ret < 0 ) throw sc_exception( ret );

    }

    }
    catch ( sc_exception &e )
    {
        avcodec_flush_buffers(is->video_st->codec);
        av_free_packet(&pkt);
        av_frame_free(&frame);
    }

    }

}
