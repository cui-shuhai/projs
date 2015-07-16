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
#include "left_pane.h"


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
 //XX   do_init();
    pgl = new QGridLayout();

    screens.clear();

    //this changes the background color
    setBackgroundRole( QPalette::Background);
    QPalette Pal(palette());
    // set black background
    Pal.setColor(QPalette::Background, Qt::black);
    setAutoFillBackground(true);
    setPalette(Pal);

    show();

}

sc_sites::~sc_sites()
{
  shared_ptr< sc_qt_player > tmp;

  SCREENS::iterator it = screens.begin();

  for( ; it != screens.end(); it++ )
  {
      tmp.reset( it->second );
  }
  do_exit();
}

void sc_sites::do_init()
{
    static bool initialize = false;
    if( initialize == false )
    {
        av_log_set_flags(AV_LOG_SKIP_REPEATED);

        /* register all codecs, demux and protocols */
        avcodec_register_all();

        #if CONFIG_AVDEVICE
            avdevice_register_all();
        #endif
        #if CONFIG_AVFILTER
            avfilter_register_all();
        #endif

        av_register_all();

        initialize = true;
    }

    if( avformat_network_init() < 0 )
    {
        sc_log( "network init failed ");
    }
}

void sc_sites::do_exit()
{
    av_lockmgr_register(NULL);
    avformat_network_deinit();

    exit(0);
}


void sc_sites::start()
{
    int i = 0;

    left_pane *l_pane = ((soco_wnd *)parent())->lpnl;
    sc_qt_player* temp = 0;
    string nm, url;

    int r, c, ir, ic;
    unsigned int sz = 0;

    for( i = 0; i < l_pane->site_nodes.size(); i++ )
        if( l_pane->site_nodes[i]->b_checked )
            sz++;

    ::get_grid( sz, r, c );

    sz = 0;


    for( i = 0; i < l_pane->site_nodes.size(); i++ )
    {
        if( l_pane->site_nodes[i]->b_checked )
         {
            temp = new sc_qt_player(this);

            sc_log2( SC_LOG_QT_PLAYER, temp );

            temp->channel = l_pane->site_nodes[i]->site_url;
            nm = l_pane->site_nodes[i]->site_name;
            screens[nm] = temp;

            ir = sz/c;
            ic = sz%c;
            pgl->addWidget( temp, ir , ic, 1, 1 );
            sz++;
         }
    }
    pgl->setSpacing( 0 );
    setLayout( pgl );

    BOOST_FOREACH( SCREENS::value_type &rv, screens )
    {
        rv.second->start();

        rv.second->refresh_engine->start(); //XX
        QThread::msleep(20);
    }  
}

void sc_sites::stop()
{
    BOOST_FOREACH( SCREENS::value_type &rv, screens )
    {
        rv.second->do_exit();
 //       rv.second->refresh_engine->stop();
    }

    QThread::msleep(800);
 #if 0
//    BOOST_FOREACH( SCREENS::value_type &rv, screens )
    {
        delete rv.second;
    }
#endif
    screens.clear();
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
        screens.erase( url );
        delete plr;
    }
}
