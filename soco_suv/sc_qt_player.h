#ifndef VPLAYER_H
#define VPLAYER_H

#include <QWaitCondition>


extern "C" {

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
#include "libavfilter/avfilter.h"

#include "ffplay_define.h"

}
#include <string>
using namespace std;
#include "sc_decoder.h"

#include <QGLWidget>

class sc_read_thread;
class sc_video_thread;
class sc_site_refresh;
class sc_decoder;


#include <string>
using namespace std;
#undef main
#include <QWidget>
#include <QMediaPlayer>
#include <QVideoWidget>
#include <QHBoxLayout>
#include <QMovie>
#include <QAbstractVideoSurface>

class QAbstractItemView;

class sc_qt_player : public QGLWidget
{
      Q_OBJECT
public:
    explicit sc_qt_player( QWidget *parent = 0  );
    ~sc_qt_player();
public:
    void change_channel( string url );


public:
   static AVPacket flush_pkt;
    string channel;
    int framedrop;
    int seek_by_bytes;
    int64_t start_time;
    int audio_disable;
    int video_disable;
    int subtitle_disable;
    int display_disable;
    int wanted_stream[AVMEDIA_TYPE_NB];
    int show_status;
    enum VideoState::ShowMode show_mode;
    int infinite_buffer;
    int loop;
    int autoexit;
    int64_t duration ;
    int av_sync_type ;
    int lowres;
    int workaround_bugs;
    int fast;
    int error_concealment;
    double rdftspeed;

signals:

public slots:


public:
    static int compute_mod(int a, int b)
    {
        return a < 0 ? a%b + b : a%b;
    }
    double get_clock(Clock *c);
    void set_clock_at(Clock *c, double pts, int serial, double time);
    void set_clock(Clock *c, double pts, int serial);
    void set_clock_speed(Clock *c, double speed);
    void init_clock(Clock *c, int *queue_serial);
    void sync_clock_to_slave(Clock *c, Clock *slave);
    int get_master_sync_type();
    double get_master_clock();
    void check_external_clock_speed();
    int queue_picture( AVFrame *src_frame,
                       double pts,
                       int64_t pos,
                       int serial);

    int is_realtime( AVFormatContext *s );

    void update_sample_display( short *samples, int samples_size);

    void step_to_next_frame();
    double compute_target_delay(double delay );

    void pictq_next_picture();
    int pictq_prev_picture();
    void update_video_pts( double pts, int64_t pos, int serial);
    static void video_refresh(void *opaque, double *remaining_time);

    /* display the current picture, if any */
    void video_display();

    void stream_seek( int64_t pos,
                      int64_t rel,
                      int seek_by_bytes);
    void stream_toggle_pause();
    void toggle_pause();

    void video_image_display();
    void start();
    int  play();


public:

    VideoState * is;
    sc_decoder * x_decoder;
    QWaitCondition * wc_read_thread;
    sc_read_thread * p_read_thread;
    sc_video_thread *p_video_thread;
    QMutex * pictq_mutex;
    QWaitCondition * pictq_cond;
    sc_site_refresh * refresh_engine;


public:

    void stream_component_close( int stream_index);
    void alloc_picture(sc_qt_player *plr);
    void refresh_loop_wait_event(sc_qt_player *plr );

    void do_exit();
public slots:
    void qt_play();

private slots:
    void movieStateChanged(QMovie::MovieState state);
    void frameChanged(int frame);
    void setPosition(int frame);

private:
        GLuint  texId;

protected:
    QSize sizeHint() const;
    void initializeGL();
    void paintGL();
    void resizeGL(int width, int height);
 //   int w, h;
    int gl_inited;

};

#endif // VPLAYER_H

