#ifndef SOCO_AVCD_H
#define SOCO_AVCD_H

#include <string>
using namespace std;

#include "miss_def.h"

#ifdef __cplusplus
extern "C" {
#endif
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/avutil.h>
#include <libswscale/swscale.h>

#ifdef __cplusplus
}
#endif

class sc_code_decode
{
public:
    static void soco_avinit();
    static void init_opts();
    static void uninit_opts();

public:
    sc_code_decode();
    virtual  ~sc_code_decode();

    // url : either file or network address
    virtual int sc_open( string url) = 0;
    virtual int sc_read( AVFrame **pF ) =0;
    virtual int sc_has_more() = 0;

public:
//    static AVDictionary *sc_format_opts, *codec_opts, *resample_opts;
    string src;
    AVFormatContext* pFormatCtx;
    //AVDictionary *format_opts;  // strange , it can not be declared inside class
    AVCodecContext  *pCodecCtx;
    AVCodec         *pCodec;
    AVInputFormat * 	fmt;
    int video_stream_index;


};

#endif // SOCO_AVCD_H
