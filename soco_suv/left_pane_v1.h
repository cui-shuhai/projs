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


public:
    typedef struct site_node
    {
        QLineEdit site_name;
        QLineEdit site_url;
        QCheckBox site_ctrl;
    } site_ndoe ;

    QVBoxLayout  *pgbx;
    QVBoxLayout *pvbl;
    QGroupBox *header;
    vector< site_node *>  site_nodes;
    QPushButton *edit_save;
    QLabel *live_info;
    QPushButton *start_close;

private:
    bool b_edit;
    bool b_running;
};

#endif // LEFT_PANE_H
