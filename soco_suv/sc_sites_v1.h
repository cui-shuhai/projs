#ifndef SC_SITES_H
#define SC_SITES_H
#include <string>
#include <map>
#include <boost/shared_ptr.hpp>

using namespace std;
using namespace boost;
#include <QWidget>
#include <QVBoxLayout>
#include <QGridLayout>

#undef main
#include "sc_qt_player.h"

class qplayer;
class ContrlBar;


class sc_sites : public QWidget
{
    Q_OBJECT
public:
   explicit  sc_sites(QWidget *parent = 0);
    static void get_grid( int size, int & r , int & c );

signals:

public slots:
    void change_channel( string url, string new_url );
    void add_channel( string url );
    void del_channel( string url );
    void start();
    void stop();

public:
    void update();
    int addPlayer( sc_qt_player * plr );
    void paintEvent(QPaintEvent *);
public:
    QGridLayout *pgl;

    //XXX for signle channel
     //sc_player *qt_player;

     typedef map< string, sc_qt_player*   > SCREENS;

    SCREENS screens;

};

#endif // SC_SITES_H
