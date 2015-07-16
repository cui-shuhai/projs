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
#include "sc_av_work_around.h"
#if 0
int64_t sc_av_frame_get_best_effort_timestamp(const AVFrame *frame)
{
    return av_frame_get_best_effort_timestamp(const AVFrame *frame);
}
AVRational sc_av_guess_sample_aspect_ratio(AVFormatContext *format, AVStream *stream, AVFrame *frame)
{
    return av_guess_sample_aspect_ratio(AVFormatContext *format, AVStream *stream, AVFrame *frame);
}
void sc_av_frame_unref(AVFrame *frame)
{
    av_frame_unref(AVFrame *frame);
}
#endif
