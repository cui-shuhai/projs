#ifndef SOCO_WND_H
#define SOCO_WND_H


#include <QSplitter>

class left_pane;
class sc_sites;

//this is the main windows class
class soco_wnd :  public QSplitter
{
      Q_OBJECT
public:
    soco_wnd(QWidget *parent = 0);
    void start();
public:
    //left panel
    left_pane *lpnl;

    // right panel only channels,

    sc_sites *rpnl;

};

#endif // SOCO_WND_H
