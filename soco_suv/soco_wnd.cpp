

#include "soco_wnd.h"

#include "sc_exception.h"


#include "sc_sites.h"
#include "left_pane.h"

soco_wnd::soco_wnd(QWidget *parent) :
    QSplitter(parent)
{

    //1  create left panel: VBoxLayout Combox, Tree and Status

    setOrientation(Qt::Horizontal);
    lpnl = new left_pane( this  );

    sc_log( lpnl )
    // 1. create right panel only channels,
    rpnl = new sc_sites( this );
    sc_log( rpnl);

    addWidget( lpnl );
    addWidget( rpnl );
    setHandleWidth( 1 );
    setBackgroundRole( QPalette::BrightText);
}

void soco_wnd::start()
{

    rpnl->setAutoFillBackground( true );

    resize( 900, 600);

    lpnl->start();
    rpnl->show();
}

