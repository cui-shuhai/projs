#ifndef SC_DECODER_H
#define SC_DECODER_H


#ifdef __cplusplus
extern "C" {
#endif

#include "config.h"
#include <inttypes.h>
#include <math.h>
#include <limits.h>
#include <signal.h>
#include "libavutil/avstring.h"
#include "libavutil/colorspace.h"
#include "libavutil/mathematics.h"
#include "libavutil/pixdesc.h"
#include "libavutil/imgutils.h"
#include "libavutil/dict.h"
#include "libavutil/parseutils.h"
#include "libavutil/samplefmt.h"
#include "libavutil/avassert.h"
#include "libavutil/time.h"
#include "libavformat/avformat.h"
#include "libavdevice/avdevice.h"
#include "libswscale/swscale.h"
#include "libavutil/opt.h"
#include "libavcodec/avfft.h"
#include "libswresample/swresample.h"
#include "libavutil/channel_layout.h"

#ifdef __cplusplus
}
#endif

#include <boost/shared_ptr.hpp>
using namespace boost;

#include "sc_code_decode.h"
#include "ffplay_define.h"

class sc_qt_player;
class QMutex;
class QWaitCondition;

class sc_decoder : public sc_code_decode
{
public:

    static int decode_interrupt_cb(void *ctx);

    sc_decoder( sc_qt_player *plr );
    ~sc_decoder();


public:
    int sc_open( string url);
    int sc_read_packet( AVPacket *pPkt );
    int sc_read( AVFrame **ppF );
    int sc_has_more();
    int sc_close();

public:

    int packet_queue_put(PacketQueue *q, AVPacket *pkt);
    int packet_queue_put_private(PacketQueue *q, AVPacket *pkt);
    int packet_queue_put_nullpacket(PacketQueue *q, int stream_index);
    /* packet queue handling */
    void packet_queue_init(PacketQueue *q);
    void packet_queue_flush(PacketQueue *q);
    void packet_queue_destroy(PacketQueue *q);
    void packet_queue_abort(PacketQueue *q);
    void packet_queue_start(PacketQueue *q);
    int packet_queue_get(PacketQueue *q, AVPacket *pkt,
                                int block, int *serial);
    int get_video_frame( AVFrame *frame, AVPacket *pkt, int *serial);
    int stream_component_open( int stream_index);
    void stream_open();
    void stream_close();

    //variables used for decoding loop
public:
    sc_qt_player    *  player;
    AVFrame         *pFrame;
    AVFrame         *pFrameRGB;
    uint8_t         *buffer;
    int             numBytes;
    int             frameFinished;
    int             abort_request;
    VideoState *    is;
    string          video_codec_name;
    AVInputFormat * iformat;

    int decoder_reorder_pts;
    int genpts;
    string st_name;
    QMutex *pktq_mutex;
    QWaitCondition * pktq_cond;
    shared_ptr< QMutex > sp_pktq_mutex;

};

#endif // SC_DECODER_H
