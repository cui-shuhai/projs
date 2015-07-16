extern "C" {

#include "config.h"
#include "libavdevice/avdevice.h"
#include "libavfilter/avfilter.h"

}
#include "sc_code_decode.h"

#include "sc_exception.h"

/* Initialize libavformat and register all the muxers, demuxers
 *and protocols. only call once for whole
*/

struct SwsContext *sc_sws_opts;
extern AVDictionary* sc_format_opts;
extern AVDictionary* sc_codec_opts;
extern AVDictionary* sc_resample_opts;

void sc_code_decode::soco_avinit()
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

        sc_code_decode::init_opts();

        initialize = true;
    }
}


/*initialize scoped global variable */

sc_code_decode::sc_code_decode( ):src("")
{
    soco_avinit();

    pFormatCtx = avformat_alloc_context();
    video_stream_index = -1;
}

sc_code_decode::~sc_code_decode()
{
     // Close the codec
     avcodec_close(pCodecCtx);

     av_free(pCodecCtx);

     // Close the video file
      avformat_close_input	( &pFormatCtx);      
      avformat_free_context( pFormatCtx );
}


void sc_code_decode::init_opts(void)
{

    if(CONFIG_SWSCALE)
        sc_sws_opts = sws_getContext(16, 16, (AVPixelFormat)0,
                                  16, 16,(AVPixelFormat) 0,
                                  SWS_BICUBIC,
                                   NULL, NULL, NULL);
}

void sc_code_decode::uninit_opts(void)
{
#if CONFIG_SWSCALE
    sws_freeContext(sc_sws_opts);
    sc_sws_opts = NULL;
#endif

    av_dict_free(&sc_format_opts);
    av_dict_free(&sc_codec_opts);
    av_dict_free(&sc_resample_opts);
}
