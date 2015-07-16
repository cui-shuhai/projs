

#include "config.h"
#include "libavutil/dict.h"
#include "libavfilter/avfilter.h"
#include "libavformat/avformat.h"
#include "libavcodec/avcodec.h"
#include "libavcodec/old_codec_ids.h"
#include "sc_helper.h"

#define 	AV_OPT_FLAG_ENCODING_PARAM   1
#define 	AV_OPT_FLAG_DECODING_PARAM   2
#define 	AV_OPT_FLAG_METADATA   4
#define 	AV_OPT_FLAG_AUDIO_PARAM   8
#define 	AV_OPT_FLAG_VIDEO_PARAM   16
#define 	AV_OPT_FLAG_SUBTITLE_PARAM   32
#define 	AV_OPT_SEARCH_FAKE_OBJ   0x0002

int check_stream_specifier(AVFormatContext *s, AVStream *st, const char *spec)
{
    int ret = avformat_match_stream_specifier(s, st, spec);
    if (ret < 0)
        av_log(s, AV_LOG_ERROR, "Invalid stream specifier: %s.\n", spec);
    return ret;
}

AVDictionary *filter_codec_opts(AVDictionary *opts, enum AVCodecID codec_id,
                                AVFormatContext *s, AVStream *st, AVCodec *codec)
{
    AVDictionary    *ret = NULL;
    AVDictionaryEntry *t = NULL;
    int            flags = s->oformat ? AV_OPT_FLAG_ENCODING_PARAM
                                      : AV_OPT_FLAG_DECODING_PARAM;
    char          prefix = 0;
    const AVClass    *cc = avcodec_get_class();

    if (!codec)
        codec            = s->oformat ? avcodec_find_encoder(codec_id)
                                      : avcodec_find_decoder(codec_id);

    switch (st->codec->codec_type) {
    case AVMEDIA_TYPE_VIDEO:
        prefix  = 'v';
        flags  |= AV_OPT_FLAG_VIDEO_PARAM;
        break;
    case AVMEDIA_TYPE_AUDIO:
        prefix  = 'a';
        flags  |= AV_OPT_FLAG_AUDIO_PARAM;
        break;
    case AVMEDIA_TYPE_SUBTITLE:
        prefix  = 's';
        flags  |= AV_OPT_FLAG_SUBTITLE_PARAM;
        break;
    }

    while (t = av_dict_get(opts, "", t, AV_DICT_IGNORE_SUFFIX)) {
        char *p = strchr(t->key, ':');

        /* check stream specification in opt name */
        if (p)
            switch (check_stream_specifier(s, st, p + 1)) {
            case  1: *p = 0; break;
            case  0:         continue;
            default:         return NULL;
            }

        if (av_opt_find(&cc, t->key, NULL, flags, AV_OPT_SEARCH_FAKE_OBJ) ||
            (codec && codec->priv_class &&
             av_opt_find(&codec->priv_class, t->key, NULL, flags,
                         AV_OPT_SEARCH_FAKE_OBJ)))
            av_dict_set(&ret, t->key, t->value, 0);
        else if (t->key[0] == prefix &&
                 av_opt_find(&cc, t->key + 1, NULL, flags,
                             AV_OPT_SEARCH_FAKE_OBJ))
            av_dict_set(&ret, t->key + 1, t->value, 0);

        if (p)
            *p = ':';
    }
    return ret;
}



AVDictionary **setup_find_stream_info_opts(AVFormatContext *s,
                                           AVDictionary *codec_opts)
{
    int i;
    AVDictionary **opts;

    if (!s->nb_streams)
        return NULL;
    opts = av_mallocz(s->nb_streams * sizeof(*opts));
    if (!opts) {
        av_log(NULL, AV_LOG_ERROR,
               "Could not alloc memory for stream options.\n");
        return NULL;
    }
    for (i = 0; i < s->nb_streams; i++)
        opts[i] = filter_codec_opts(codec_opts, s->streams[i]->codec->codec_id,
                                    s, s->streams[i], NULL);
    return opts;
}



int  avcodec_decode_videoX(AVCodecContext *avctx, AVFrame *picture,
                                              int *got_picture_ptr,
                                              const AVPacket *avpkt)
{
    AVCodecInternal *avci = avctx->internal;
    int ret;
    // copy to ensure we do not change avpkt
    AVPacket tmp = *avpkt;

    if (!avctx->codec)
        return AVERROR(EINVAL);
    if (avctx->codec->type != AVMEDIA_TYPE_VIDEO) {
        av_log(avctx, AV_LOG_ERROR, "Invalid media type for video\n");
        return AVERROR(EINVAL);
    }

    *got_picture_ptr = 0;
    if ((avctx->coded_width || avctx->coded_height) && av_image_check_size(avctx->coded_width, avctx->coded_height, 0, avctx))
        return AVERROR(EINVAL);

    avcodec_get_frame_defaults(picture);

    if (!avctx->refcounted_frames)
        av_frame_unref(&avci->to_free);

    if ((avctx->codec->capabilities & CODEC_CAP_DELAY) || avpkt->size || (avctx->active_thread_type & FF_THREAD_FRAME)) {
        int did_split = av_packet_split_side_data(&tmp);
        apply_param_change(avctx, &tmp);
        avctx->pkt = &tmp;
        if (HAVE_THREADS && avctx->active_thread_type & FF_THREAD_FRAME)
     //       ret = ff_thread_decode_frame(avctx, picture, got_picture_ptr,
     //                                    &tmp);;
            ;
        else {
            ret = avctx->codec->decode(avctx, picture, got_picture_ptr,
                                       &tmp);
            picture->pkt_dts = avpkt->dts;

            if(!avctx->has_b_frames){
                av_frame_set_pkt_pos(picture, avpkt->pos);
            }
            //FIXME these should be under if(!avctx->has_b_frames)
            /* get_buffer is supposed to set frame parameters */
            if (!(avctx->codec->capabilities & CODEC_CAP_DR1)) {
                if (!picture->sample_aspect_ratio.num)    picture->sample_aspect_ratio = avctx->sample_aspect_ratio;
                if (!picture->width)                      picture->width               = avctx->width;
                if (!picture->height)                     picture->height              = avctx->height;
                if (picture->format == AV_PIX_FMT_NONE)   picture->format              = avctx->pix_fmt;
            }
        }
  //      add_metadata_from_side_data(avctx, picture);

       // emms_c(); //needed to avoid an emms_c() call before every return;

        avctx->pkt = NULL;
        if (did_split) {
            av_packet_free_side_data(&tmp);
            if(ret == tmp.size)
                ret = avpkt->size;
        }

        if (ret < 0 && picture->data[0])
            av_frame_unref(picture);

        if (*got_picture_ptr) {
            if (!avctx->refcounted_frames) {
                avci->to_free = *picture;
                avci->to_free.extended_data = avci->to_free.data;
                memset(picture->buf, 0, sizeof(picture->buf));
            }

            avctx->frame_number++;
            /*
            av_frame_set_best_effort_timestamp(picture,
                                               guess_correct_pts(avctx,
                                                                 picture->pkt_pts,
                                                                 picture->pkt_dts));
                                                                 */
        }
    } else
        ret = 0;

    /* many decoders assign whole AVFrames, thus overwriting extended_data;
     * make sure it's set correctly */
    picture->extended_data = picture->data;

    return ret;
}


void apply_param_change(AVCodecContext *avctx, AVPacket *avpkt)
{
    int size = 0;
    const uint8_t *data;
    uint32_t flags;

    if (!(avctx->codec->capabilities & CODEC_CAP_PARAM_CHANGE))
        return;

    data = av_packet_get_side_data(avpkt, AV_PKT_DATA_PARAM_CHANGE, &size);
    if (!data || size < 4)
        return;
   // flags = bytestream_get_le32(&data);
    size -= 4;
    if (size < 4) /* Required for any of the changes */
        return;
    if (flags & AV_SIDE_DATA_PARAM_CHANGE_CHANNEL_COUNT) {
       // avctx->channels = bytestream_get_le32(&data);
        size -= 4;
    }
    if (flags & AV_SIDE_DATA_PARAM_CHANGE_CHANNEL_LAYOUT) {
        if (size < 8)
            return;
   //     avctx->channel_layout = bytestream_get_le64(&data);
        size -= 8;
    }
    if (size < 4)
        return;
    if (flags & AV_SIDE_DATA_PARAM_CHANGE_SAMPLE_RATE) {
      //  avctx->sample_rate = bytestream_get_le32(&data);
        size -= 4;
    }
    if (flags & AV_SIDE_DATA_PARAM_CHANGE_DIMENSIONS) {
        if (size < 8)
            return;
   //     avctx->width  = bytestream_get_le32(&data);
   //     avctx->height = bytestream_get_le32(&data);
        avcodec_set_dimensions(avctx, avctx->width, avctx->height);
        size -= 8;
    }
}


