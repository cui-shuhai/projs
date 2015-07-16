extern "C" {
#include "libavfilter/avfilter.h"
}

#include <boost/foreach.hpp>
using namespace boost;

#undef main
#include <QTextEdit>
#include <QPainter>
#include <QRect>
#include <QVBoxLayout>

#include "sc_exception.h"
#include "sc_qt_player.h"
#include "sc_sites.h"
#include "sc_site_refresh.h"


static void get_grid( int s, int & r , int & c )
{
    int i = 1;
    for( ; ; i++ )
    {
        if( i * i == s )
        {
            r = c = i;
            break;
        }
        else if( i * i > s )
        {
            r = i - 1;
            c = i;
            break;
        }
    }
}

sc_sites::sc_sites(QWidget *parent) :
    QWidget(parent)
{
    //XXX hard code here for development
    // final vesion should be initialized from a file


    //qt_player = new sc_qt_player();

    pgl = new QGridLayout();

   // pgl->addWidget( qt_player, 0, 0, 1, 1 );

    sc_log( pgl );
    screens.clear();
    //setLayout( pgl);
}

void sc_sites::start()
{
    sc_qt_player* temp = new sc_qt_player();
    temp->channel =  "C:\\Users\\scui\\Desktop\\video\\Clip_480p.mpg";
    screens["first"] =  temp ;
    pgl->addWidget(temp, 0, 0, 1, 1 );

    temp = new sc_qt_player();
    temp->channel =  "C:\\Users\\scui\\Desktop\\video\\Clip_1080.mpg";
    screens["second"] =  temp ;
    pgl->addWidget(temp, 0,1, 1, 1 );

#if 0
    temp = new sc_qt_player();
    temp->channel =  "C:\\Users\\scui\\Desktop\\video\\Clip_1080x.mpg";
    screens["second"] =  temp ;
    pgl->addWidget(temp, 0, 2, 1, 1 );


    temp = new sc_qt_player();
    temp->channel =  "C:\\Users\\scui\\Desktop\\video\Clip_1080xx.mpg";
    screens["second"] =  temp ;
    pgl->addWidget(temp, 1, 0, 1, 1 );
#endif
    temp = new sc_qt_player();
    temp->channel =  "C:\\Users\\scui\\Desktop\\video\\Clip_xx.mpg";
    screens["third"] =  temp ;
    pgl->addWidget(temp, 1, 1, 1, 1 );

    temp = new sc_qt_player();
    temp->channel =  "C:\\Users\\scui\\Desktop\\video\\Clip_xx2.mpg";
    screens["fourth"] = temp ;
    pgl->addWidget(temp, 1, 2, 1, 1 );

    setLayout( pgl );


    BOOST_FOREACH( SCREENS::value_type &rv, screens )
    {
        rv.second->start();
        rv.second->refresh_engine->start();
    }

   //sc_sites_refresh * ssr = new sc_sites_refresh( this );
   //ssr->start();
}

void sc_sites::stop()
{
}

int sc_sites::addPlayer( sc_qt_player * plr )
{
    if( plr == NULL  || screens.size() >= 6 )
    {
        throw -1;
    }

    screens[plr->x_decoder->st_name] = plr ;

    return -1;
}

void sc_sites::update()
{
    int s = screens.size();

   if( s > 0 )
    {
       int col, row;
       ::get_grid( s, col, row );
    }
}

void sc_sites::paintEvent(QPaintEvent *)
{
}


void sc_sites::change_channel( string url, string new_url )
{
    if( screens.find( url ) != screens.end())
   {
       sc_qt_player *plr = screens[ url ];
       plr->change_channel( new_url );
   }
}

void sc_sites::add_channel( string url )
{
    sc_qt_player *plr = new sc_qt_player();
    screens[ url] = plr;
}

void sc_sites::del_channel( string url )
{
    if( screens.find( url ) != screens.end() )
    {
        sc_qt_player *plr = screens[ url ];
        //plr stop play
        //plr->change_channel( new_url );
        screens.erase( url );
        delete plr;
    }
}
