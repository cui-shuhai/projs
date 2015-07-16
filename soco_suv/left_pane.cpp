
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
#define SC_CONFIG_CHANNELS  6

left_pane::left_pane(QWidget *parent )
    : QWidget(parent)
    , b_edit( false )
{
    pvbl = new QVBoxLayout;
    sc_log( pvbl );

    b_running =0;

    setBaseSize( 28, 80);
    setMaximumWidth(220);

    header = new QGroupBox( "Watching Sites:");

    pgbx = new QVBoxLayout;


    int i;

    load_confuguraiton();

    tree_nodes = new QTreeWidget;
    for( i = 0; i < site_nodes.size(); i++ )
    {
        QTreeWidgetItem *parent = new QTreeWidgetItem(QStringList(site_nodes[i]->site_name.c_str()));
        parent->setFlags(parent->flags()|Qt::ItemIsUserCheckable);
        if( site_nodes[i]->b_checked )
            parent->setCheckState(0,Qt::Checked);
        else
             parent->setCheckState(0,Qt::Unchecked);
        tree_nodes->addTopLevelItem(parent);
        QTreeWidgetItem *child = new QTreeWidgetItem( QStringList(site_nodes[i]->site_url.c_str()));

        parent->addChild( child );
    }
     pgbx->addWidget( tree_nodes );

    edit_save = new QPushButton( "Save");

    pgbx->addWidget(edit_save);

    header->setTitle("Watching Sites:");

    header->setLayout( pgbx );

    pvbl->addWidget( header );

    start_close = new QPushButton( "START");

    pvbl->addWidget( start_close );

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

        int i,  b;
        for( i = 0; i < tree_nodes->topLevelItemCount(); ++i )
        {
           QTreeWidgetItem *item = tree_nodes->topLevelItem( i );

           site_nodes[i]->site_name = item->text(0).toStdString();
           site_nodes[i]->site_url = item->child( 0 )->text( 0 ).toStdString();
           Qt::CheckState qst = item->checkState(0);
           b = ( qst == Qt::PartiallyChecked  || qst == Qt::Checked )? 1 : 0;
           site_nodes[i]->b_checked = b;

               // Do something with item ...
            qs << QString( site_nodes[i]->site_name.c_str() )     << endl;
            qs << QString( site_nodes[i]->site_url.c_str() ) << endl;
             qs << QString::number( site_nodes[i]->b_checked ) << endl;

            site_ndoe *nt = site_nodes[i];
            sc_log( nt->site_name );
            sc_log( nt->site_url);
            sc_log( nt->b_checked );
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
            nt->site_name = qs.readLine().toStdString();
            nt->site_url =  qs.readLine().toStdString();
            nt->b_checked = qs.readLine().toInt();
            sc_log( nt->site_name );
            sc_log( nt->site_url);
            sc_log( nt->b_checked );

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

            nd->site_name = "site name";
            nd->site_url =  "site_url";
            nd->b_checked = 0;
            site_nodes.push_back(nd);
        }
    }
}


void left_pane::start()
{
    sc_sites *pchannels = ( (soco_wnd*) this->parent())->rpnl;

    connect( this, SIGNAL( signal_start() ), pchannels, SLOT( start() ) );
    connect( this, SIGNAL( signal_stop() ), pchannels, SLOT( stop() ) );
    connect( start_close, SIGNAL( clicked( ) ), this, SLOT( start_stop_slot() ) );

    connect( edit_save, SIGNAL( clicked()), this, SLOT( edit_save_clicked()));

    connect( tree_nodes, SIGNAL( itemDoubleClicked ( QTreeWidgetItem * , int  )  ), this,
             SLOT( tree_item_dbl_clk(QTreeWidgetItem*,int)));
    connect( tree_nodes, SIGNAL( currentItemChanged ( QTreeWidgetItem * , QTreeWidgetItem *  )  ), this,
             SLOT( tree_item_changed(QTreeWidgetItem*,QTreeWidgetItem *)));

 }

void left_pane::site_checked()
{
}

void left_pane::edit_save_clicked()
{

    if( b_edit == false )
    {
        b_edit = true;

        save_configuration();
        edit_save->setText( "Save");
    }
    else
    {


        save_configuration();
    }

     header->layout();
}

void left_pane::start_stop_slot()
{
    if( b_running )
    {
        b_running = 0;
        start_close->setText("Start");
        emit signal_stop();
    }
    else
    {
        b_running = 1;
        start_close->setText("Stop");
        emit signal_start();
    }
}


void left_pane::tree_item_dbl_clk ( QTreeWidgetItem * item, int column )
{
    tree_nodes->openPersistentEditor(item, column );
    edit_save->setDisabled( false );
}

void left_pane::tree_item_changed( QTreeWidgetItem * current, QTreeWidgetItem * previous)
{
    tree_nodes->closePersistentEditor( previous);
    tree_nodes->closePersistentEditor( current);
}

