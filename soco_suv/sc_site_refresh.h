#ifndef SC_SITE_REFRESH_H
#define SC_SITE_REFRESH_H

#include <QThread>

class sc_qt_player;
class QMutex;
class sc_site_refresh : public QThread
{
    Q_OBJECT
public:
    explicit sc_site_refresh(QObject *parent = 0);
    void set_arg( sc_qt_player * plr );

signals:

public slots:


protected:
    void run();

public:
    sc_qt_player * x_player;
    static QMutex * refresh_mutex;


};

#endif // SC_SITES_REFRESH_H
