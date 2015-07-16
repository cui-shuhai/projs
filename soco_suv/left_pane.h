#ifndef LEFT_PANE_H
#define LEFT_PANE_H

#include <string>
#include <vector>

using namespace std;


#include <QWidget>
#include <QString>
#include <QTreeWidgetItem>
#include <QCheckBox>
#include <QGroupBox>
#include <QContextMenuEvent>
#include <QLineEdit>



#include "soco_wnd.h"
#include "sc_sites.h"


class QVBoxLayout;
class QLabel;
class QPushButton;

class left_pane : public QWidget
{
      Q_OBJECT
public:
    left_pane(QWidget *parent = 0 );
    ~left_pane();
    void start();
    void setTreeColumns( int col = 1 );
    void addTreeHeader( QString &tile);
    void addSiteGroup( QString &site);
    void addSite(QString group, QString &name, QString &url);
    void save_configuration();
    void load_confuguraiton();

signals:
    void change_channel( string url );
    void add_channel( string url );
    void del_channel( string url );
    void signal_start();
    void signal_stop();

public slots:
    void site_checked();
    void edit_save_clicked();
    void start_stop_slot();
#ifndef SITE_NODE_LIST
    void tree_item_dbl_clk ( QTreeWidgetItem * item, int column );
    void tree_item_changed( QTreeWidgetItem * current, QTreeWidgetItem * previous);

#endif

public:
    typedef struct site_node
    {
#ifdef SITE_NODE_LIST
        QLineEdit site_name;
        QLineEdit site_url;
        QCheckBox site_ctrl;
#else
        string site_name;
        string site_url;
        int b_checked;
#endif
    } site_ndoe ;
    vector< site_node *>  site_nodes;
#ifndef SITE_NODE_LIST
    QTreeWidget * tree_nodes;
#endif

    QVBoxLayout  *pgbx;
    QVBoxLayout *pvbl;
    QGroupBox *header;
    QPushButton *edit_save;
#ifdef LIVE_INFO
    QLabel *live_info;
#endif
    QPushButton *start_close;

private:
    bool b_edit;
    bool b_running;
};

#endif // LEFT_PANE_H
