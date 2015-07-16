#include <boost/foreach.hpp>


using namespace boost;
#include <string>
using namespace std;


#include <QMap>
#include <QMutex>
#include "sc_sites.h"
#include  "sc_qt_player.h"
#include "sc_site_refresh.h"

QMutex * sc_site_refresh::refresh_mutex = new QMutex();

sc_site_refresh::sc_site_refresh(QObject *parent) :
    QThread(parent)
{
    x_player = 0;

}

void sc_site_refresh::set_arg( sc_qt_player * plr )
{
    x_player = plr;
}

void sc_site_refresh::run()
{

    while( x_player == 0 )
    {
        QThread::msleep( 20 );
    }

    while( x_player->display_disable == 0 )
    {
        sc_site_refresh::refresh_mutex->lock();
       x_player->refresh_loop_wait_event( x_player );
       QThread::msleep(28 );
   //     QThread::msleep(16 );
       sc_site_refresh::refresh_mutex->unlock();


    }

}
