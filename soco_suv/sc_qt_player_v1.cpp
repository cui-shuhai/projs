extern "C" {
#include "libavfilter/avfilter.h"
}

#include <iostream>
#include <string>
using namespace std;
#include <QApplication>
#include <QFileDialog>
#include <QFileInfo>
#include <QMediaMetaData>
#include <QMovie>
#include <QLabel>
#include <QStyle>
#include <QSlider>
#include <QVideoProbe>
#include <QPushButton>
#include <QMessageBox>
#include <QAbstractItemView>
#include <QTime>
#include <QFormLayout>
#include <QTextEdit>
#include <QVBoxLayout>
#include <QVideoWidget>
#include <QThread>
#include <QMouseEvent>
#include <QPainter>

#include <GL/glu.h>
#include <QMutex>

#include "sc_exception.h"

#include "sc_read_thread.h"
#include "sc_video_thread.h"

#include "sc_qt_player.h"
#include "sc_sites.h"
#include "sc_site_refresh.h"

#define ERR_SC_QT_PLAYER -10

extern void SaveFrame(AVFrame *pFrame, int width, int height, int iFrame) ;


sc_qt_player::sc_qt_player(QWidget *parent )
    : sc_player(parent)
{
    texId = -1;
    setMouseTracking( true );

    //st_name = "http://www.youtube.com/watch?v=H-PWeICLvDw";
   // channel = "C:\\Users\\scui\\Desktop\\video\\Clip_480p_5sec_6mbps_new.mpg";
    channel =""
     x_decoder = new sc_decoder( this );
     p_read_thread = new sc_read_thread();
     p_read_thread->set_arg( this );
     p_video_thread = new sc_video_thread(  );
     p_video_thread->set_arg(this);
     refresh_engine = new sc_site_refresh(  );
     refresh_engine->set_arg( this );
     pictq_mutex = new QMutex( QMutex::NonRecursive );
     pictq_cond = new QWaitCondition();
     w = h = 0;
     gl_inited = 0;
}


QSize sc_qt_player::sizeHint() const
{
    sc_log( "-------------------" );
    sc_log( this->width());
    sc_log( this->height());
    return QSize(1580, 1200);
}



void sc_qt_player::start()
{

    wanted_stream   [AVMEDIA_TYPE_AUDIO]    = -1;
    wanted_stream   [AVMEDIA_TYPE_VIDEO]    = -1;
    wanted_stream   [AVMEDIA_TYPE_SUBTITLE] = -1;

    if( x_decoder->sc_open( channel ) < 0 )
    {
        sc_log( ERR_SC_QT_PLAYER );
        return;
    }

    w = is->width = rect().width();
    h = is->height = rect().height();

    is->video_stream = x_decoder->video_stream_index;
    is->video_st = x_decoder->pFormatCtx->streams[is->video_stream];
    is->ytop    = 0;
    is->xleft   = 0;

 //   video_codec_name = string( x_decoder->pCodec->name );


}
int sc_qt_player::play()
{
    return 0;
}

void sc_qt_player::qt_play()
{
}

void sc_qt_player::movieStateChanged(QMovie::MovieState state)
{
}

void sc_qt_player::frameChanged(int frame )
{
}
void sc_qt_player::setPosition(int frame )
{
}


void sc_qt_player::video_image_display()
{
    VideoPicture *vp;
    vp = &is->pictq[is->pictq_rindex];

    if( vp->pFrameRGB )
    {

        QCoreApplication::postEvent( this, new QPaintEvent( rect() ), Qt::HighEventPriority);
    }
}


void sc_qt_player::do_exit()
{
    if (is) {
        x_decoder->stream_close();
    }
    av_lockmgr_register(NULL);
   // uninit_opts();
    avformat_network_deinit();
    if (show_status)
        printf("\n");

    exit(0);
}


/* allocate a picture (needs to do that in main thread to avoid
   potential locking problems */
void sc_qt_player::alloc_picture( sc_qt_player * plr )
{
    VideoState *is = plr->is;

    VideoPicture *vp;
    vp = &is->pictq[is->pictq_windex];

    if (vp->pFrameRGB) {
        // we already have one make another,bigger/smaller
        if (vp->pFrameRGB) {
            av_free(vp->pFrameRGB);
            vp->pFrameRGB = 0;
        }
        if (vp->buffer) {
            av_free(vp->buffer);
            vp->buffer = 0;
        }
    }

    vp->pFrameRGB = avcodec_alloc_frame();

    avcodec_get_frame_defaults( vp->pFrameRGB );

    sc_log( vp->pFrameRGB );

    vp->width = 1024;
    vp->height = 516;

   /*

    vp->width =is->video_st->codec->width;
    vp->height = is->video_st->codec->height;
    */
    vp->numBytes =avpicture_get_size((AVPixelFormat)PIX_FMT_RGB24, vp->width, vp->height);
    vp->buffer = (uint8_t *)av_malloc(vp->numBytes * sizeof(uint8_t));

    if (!vp->pFrameRGB || !vp->buffer) {
        sc_log( vp->pFrameRGB );
        sc_log( vp->buffer)
        throw sc_exception( ERR_SC_QT_PLAYER );
    }

    avpicture_fill((AVPicture*)vp->pFrameRGB, vp->buffer, (AVPixelFormat)PIX_FMT_RGB24,
            vp->width, vp->height);

    pictq_mutex->lock();
    vp->allocated = 1;
    sc_log( vp->allocated );
    pictq_cond->wakeOne();
    pictq_mutex->unlock();
}


void sc_qt_player::refresh_loop_wait_event(sc_qt_player *plr )
{
    double remaining_time = 0.0;

       if (remaining_time > 0.0)
           av_usleep((int64_t)(remaining_time * 1000000.0));
       remaining_time = REFRESH_RATE;
       if (plr->is->show_mode != VideoState::SHOW_MODE_NONE &&
               (!plr->is->paused || plr->is->force_refresh))
           video_refresh(plr, &remaining_time);
}



void sc_qt_player::initializeGL()
{
    /** non faccio niente fino a quando non avrò un riferimento con valore */
    glClearColor(0.6, 0.6, 0.6, 0.0);
    sc_log( glGetError() );
    glClearDepth(1.0);
    sc_log( glGetError() );
    glShadeModel(GL_SMOOTH);
    sc_log( glGetError() );

    glEnable(GL_TEXTURE_2D);

    sc_log( glGetError() );
    glGenTextures(1, &texId);
    sc_log( glGetError() );
    glBindTexture(GL_TEXTURE_2D, texId);

    sc_log( glGetError() );
    glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
    sc_log( glGetError() );
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR);

    sc_log( glGetError() );
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glDisable(GL_TEXTURE_2D);

}

void sc_qt_player::paintGL()
{
    VideoPicture *vp;

    vp = &is->pictq[is->pictq_rindex];

     if( vp->pFrameRGB == NULL){
             return;
     };

     if( gl_inited == 0 )
     {
         glEnable( GL_TEXTURE_2D );
         glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB8, vp->width, vp->height, 0, GL_RGB, GL_UNSIGNED_BYTE, vp->pFrameRGB->data[0]);

         sc_log( glGetError() );
         glDisable(GL_TEXTURE_2D);

         gl_inited = 1;
         return;
     }


     glLoadIdentity();
     glBindTexture( GL_TEXTURE_2D, texId );
     sc_log( glGetError() );                                                                //associo la texture corrente
     glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR );
     sc_log( glGetError() );
     glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR );
     glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
     sc_log( glGetError() );
     glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, vp->width, vp->height,  GL_RGB, GL_UNSIGNED_BYTE, vp->pFrameRGB->data[0]);

     sc_log( glGetError() );

     glScalef(1.0f, -1.0f, 1.0f);
     glEnable(GL_TEXTURE_2D);

     sc_log( glGetError() );
     glBegin(GL_QUADS);
     glTexCoord2f(0.0f, 0.0f);
     glVertex3f(-1.0f, -1.0f, 0.0f);

     glTexCoord2f(0.0f, 1.0f);
     glVertex3f(-1.0f, 1.0f, 0.0f);
     glTexCoord2f(1.0f, 1.0f);
     glVertex3f(1.0f, 1.0f, 0.0f);
     glTexCoord2f(1.0f, 0.0f);
     glVertex3f(1.0f, -1.0f, 0.0f);
     glEnd();
     glDisable(GL_TEXTURE_2D);
     glScalef(1.0f, -1.0f, 1.0f);

}

void sc_qt_player::resizeGL(int width, int height)
{

    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    gl_inited = 0;
}
