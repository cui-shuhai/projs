#ifndef VPLAYER_H
#define VPLAYER_H

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

#include "sc_player.h"

class sc_qt_player : public sc_player
{
      Q_OBJECT
public:
    explicit sc_qt_player( QWidget *parent = 0  );
    void start();
    int play();
    void video_image_display();
//    static int event_loop( void * );
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
    bool presentImage(const QImage &image);
        GLuint  texId;

protected:
    QSize sizeHint() const;
    void initializeGL();
    void paintGL();
    void resizeGL(int width, int height);
    int w, h;
    int gl_inited;
};

#endif // VPLAYER_H

