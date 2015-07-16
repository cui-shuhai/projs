
#include <boost/foreach.hpp>
using namespace boost;

#include <QTreeWidget>
#include <QVBoxLayout>
#include <QLineEdit>
#include <QFont>
#include <QString>
#include <QTreeWidgetItem>
#include <QFile>
#include <QTextStream>
#include <QLabel>
#include <QCheckBox>
#include <QPushButton>
#include <QGroupBox>

#include "left_pane.h"

#include "sc_exception.h"
#include <boost/shared_ptr.hpp>

using namespace boost;

#define SC_CONFIG_FILE_NAME "sc_config.bin"

left_pane::left_pane(QWidget *parent )
    : QWidget(parent)
    , b_edit( false )
{
    pvbl = new QVBoxLayout;
    sc_log( pvbl );


    setBaseSize( 28, 80);
    setMaximumWidth(200);

    header = new QGroupBox( "Watching Sites:");

    pgbx = new QVBoxLayout;


    load_confuguraiton();

    int i;

    for( i = 0; i < site_nodes.size(); i++ )
    {
        pgbx->addWidget( &site_nodes[i]->site_ctrl );
    }

    edit_save = new QPushButton( "Edit");

    pgbx->addWidget(edit_save);

    header->setTitle("Watching Sites:");

    header->setLayout( pgbx );

    pvbl->addWidget( header );

    start_close = new QPushButton( "START");

    pvbl->addWidget( start_close );

    live_info = new QLabel;

    QPalette li_plt;

    li_plt.setColor( QPalette::Background, Qt::black );
    li_plt.setColor( QPalette::Foreground,  Qt::red );

    live_info->setAutoFillBackground(true);
    live_info->setPalette( li_plt );

    //live_info->setSizePolicy();

    pvbl->addWidget(live_info);

    setLayout( pvbl );
}


left_pane::~left_pane()
{

}
void left_pane::save_configuration()
{
    QFile file( SC_CONFIG_FILE_NAME );

    if( file.open(QIODevice::WriteOnly))
    {
        QTextStream qs( &file );
        qs << header->windowTitle() << endl;
        qs << site_nodes.size() << endl;

        int i;

        for( i = 0; i < site_nodes.size(); i++ )
        {
            qs << site_nodes[i]->site_name.text()     << endl;
            qs << site_nodes[i]->site_url.text() << endl;
            qs << (site_nodes[i]->site_ctrl.checkState()) << endl;
        }
        file.close();
    }
}

void left_pane::load_confuguraiton()
{
    QFile file( SC_CONFIG_FILE_NAME );

    if( file.open(QIODevice::ReadOnly))
    {
        QTextStream qs( &file );
        header->setTitle( qs.readLine());

        int sz = qs.readLine().toInt();
        int i = 0;

         site_node *nt;

        for( i = 0; i < sz; i++ )
        {
            nt = new site_node;
            nt->site_name.setText( qs.readLine() );
            nt->site_url.setText( qs.readLine() );
            nt->site_ctrl.setChecked( qs.readLine().toInt());
            nt->site_ctrl.setText( nt->site_name.text() );
            site_nodes.push_back( nt );
        }
        file.close();
    }
    else
    {
        header->setTitle("Survelliance Sites:");
        int i;

        site_ndoe *nd;

        for( i = 0; i < 6; i++ )
        {
            nd = new site_ndoe;
            nd->site_name.setText("site ....");
            nd->site_url.setText( "url ....");
            nd->site_ctrl.setChecked( false );
            nd->site_ctrl.setText( nd->site_name.text());
            site_nodes.push_back(nd);
        }
    }
}


void left_pane::start()
{
    int i;
    sc_sites *pchannels = ( (soco_wnd*) this->parent())->rpnl;

    connect( this, SIGNAL( signal_start() ), pchannels, SLOT( start() ) );
    connect( this, SIGNAL( signal_stop() ), pchannels, SLOT( stop() ) );
    connect( start_close, SIGNAL( clicked( ) ), this, SLOT( start_stop_slot() ) );
    for( i = 0; i < 6; i++ )
        connect( &site_nodes[i]->site_ctrl, SIGNAL( stateChanged() ), this, SLOT( site_checked ()));

    connect( edit_save, SIGNAL( clicked()), this, SLOT( edit_save_clicked()));

    connect( this, SIGNAL( change_channel( strng)),  pchannels , SLOT( change_channel(string)) );
    connect( this, SIGNAL( add_channel( strng)),  pchannels , SLOT( add_channel(string)) );
    connect( this, SIGNAL( del_channel( strng)),  pchannels , SLOT( del_channel(string)) );
}

void left_pane::site_checked()
{
}

void left_pane::edit_save_clicked()
{
    int i;

    if( b_edit == false )
    {
        b_edit = true;

        for( i = 0; i < site_nodes.size(); i++ )
        {
            pgbx->removeWidget( &site_nodes[i]->site_ctrl );
            site_nodes[i]->site_ctrl.hide();
        }

        pgbx->removeWidget( edit_save );
        edit_save->hide();
        for( i = 0; i < site_nodes.size(); i++ )
        {
            pgbx->addWidget( &site_nodes[i]->site_name );
            site_nodes[i]->site_name.show();
            pgbx->addWidget( &site_nodes[i]->site_url );
            site_nodes[i]->site_url.show();
        }

        pgbx->addWidget( edit_save );
        edit_save->show();
        pgbx->update();
        edit_save->setText( "Save");
    }
    else
    {
        b_edit = false;

        for( i = 0; i < site_nodes.size(); i++ )
        {
            pgbx->removeWidget( &site_nodes[i]->site_name );
            site_nodes[i]->site_name.hide();
            pgbx->removeWidget( &site_nodes[i]->site_url );
            site_nodes[i]->site_url.hide();
        }

        pgbx->removeWidget( edit_save );
        edit_save->hide();

        for( i = 0; i < site_nodes.size(); i++ )
        {
            site_nodes[i]->site_ctrl.setText( site_nodes[i]->site_name.text() );
            pgbx->addWidget( &site_nodes[i]->site_ctrl );
            site_nodes[i]->site_ctrl.show();
        }

        pgbx->addWidget( edit_save );
        edit_save->show();

        save_configuration();

        pgbx->update();


        edit_save->setText( "Edit");
    }
     header->layout();
}

void left_pane::start_stop_slot()
{
    if( b_running )
    {
        b_running = !b_running;
        start_close->setText("Start");
        emit signal_stop();
    }
    else
    {
        b_running = !b_running;
        start_close->setText("Stop");
        emit signal_start();
    }
}
