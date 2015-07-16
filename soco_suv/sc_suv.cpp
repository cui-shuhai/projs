
#include <QApplication>

#include "sc_exception.h"
#include "soco_wnd.h"


#define SOCO   "Soco Surveillance System"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    // 1. create main window
    soco_wnd main_wnd;

    sc_log( "main_wnd created ");

    main_wnd.setWindowTitle( SOCO );
    sc_log( SOCO );


    main_wnd.show();
    main_wnd.start();


    return app.exec();
}
