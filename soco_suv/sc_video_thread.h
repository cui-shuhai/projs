#ifndef SC_VIDEO_THREAD_H
#define SC_VIDEO_THREAD_H

#include <QThread>

class sc_qt_player;
class sc_video_thread : public QThread
{
    Q_OBJECT
public:
    explicit sc_video_thread(QObject *parent = 0);
    void set_arg( sc_qt_player * plr );

signals:

public slots:    

protected:
    void	run();

private:
    sc_qt_player * x_player;

};

#endif // SC_VIDEO_THREAD_H
