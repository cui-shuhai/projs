#ifndef SC_READ_THREAD_H
#define SC_READ_THREAD_H

#include <QThread>

class sc_qt_player;

/* the parent is player, so it need to be created from palyer */
class sc_read_thread : public QThread
{
    Q_OBJECT
public:
    explicit sc_read_thread(QObject *parent = 0 );
    void set_arg( sc_qt_player * plr );

signals:

public slots:

protected:
    void	run();

private:
    sc_qt_player * x_player;

};

#endif // SC_READ_THREAD_H
