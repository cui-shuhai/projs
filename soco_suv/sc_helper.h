#ifndef SC_HELPER_H
#define SC_HELPER_H

#ifdef __cplusplus
extern "C" {
#endif


AVDictionary **setup_find_stream_info_opts(
        AVFormatContext *s,
        AVDictionary *codec_opts);






typedef struct FramePool {
    /**
     * Pools for each data plane. For audio all the planes have the same size,
     * so only pools[0] is used.
     */
    AVBufferPool *pools[4];

    /*
     * Pool parameters
     */
    int format;
    int width, height;
    int stride_align[AV_NUM_DATA_POINTERS];
    int linesize[4];
    int planes;
    int channels;
    int samples;
} FramePool;



typedef struct AVCodecInternal {
    /**
     * Whether the parent AVCodecContext is a copy of the context which had
     * init() called on it.
     * This is used by multithreading - shared tables and picture pointers
     * should be freed from the original context only.
     */
    int is_copy;

    /**
     * Whether to allocate progress for frame threading.
     *
     * The codec must set it to 1 if it uses ff_thread_await/report_progress(),
     * then progress will be allocated in ff_thread_get_buffer(). The frames
     * then MUST be freed with ff_thread_release_buffer().
     *
     * If the codec does not need to call the progress functions (there are no
     * dependencies between the frames), it should leave this at 0. Then it can
     * decode straight to the user-provided frames (which the user will then
     * free with av_frame_unref()), there is no need to call
     * ff_thread_release_buffer().
     */
    int allocate_progress;

#if FF_API_OLD_ENCODE_AUDIO
    /**
     * Internal sample count used by avcodec_encode_audio() to fabricate pts.
     * Can be removed along with avcodec_encode_audio().
     */
    int64_t sample_count;
#endif

    /**
     * An audio frame with less than required samples has been submitted and
     * padded with silence. Reject all subsequent frames.
     */
    int last_audio_frame;

    AVFrame to_free;

    FramePool *pool;

    /**
     * temporary buffer used for encoders to store their bitstream
     */
    uint8_t *byte_buffer;
    unsigned int byte_buffer_size;

    void *frame_thread_encoder;

    /**
     * Number of audio samples to skip at the start of the next decoded frame
     */
    int skip_samples;
} AVCodecInternal;



void apply_param_change(AVCodecContext *avctx, AVPacket *avpkt);
AVDictionary *filter_codec_opts(AVDictionary *opts,
                                enum AVCodecID codec_id,
                                AVFormatContext *s,
                                AVStream *st, AVCodec *codec);

#ifdef __cplusplus
}
#endif

#endif // SC_HELPER_H
