/* sonar_option.c -- Foreign Table, Server , and User mapping options API
 *
**/
#include "sonar_utils.h"
#include "sonar_nm.h"
#include "sonar_log.h"
#include "sonar_join.h"
#include "sonar_outstretch.h"
#include "sonar_mis.h"
#include "sonar_bson.h"
#include "sonar_mongo.h"

#include "sonar_restriction.h"
#include "sonar_agg.h"
#include "sonar_group.h"
#include "sonar_query.h"
#include "sonar_distinct.h"
#include "sonar_order.h"
#include "sonar_path.h"
#include "sonar_option.h"



#define HOSTNAME_OPTION "hostname"
#define PORT_OPTION "port"
#define USER_OPTION "user"
#define PASSWORD_OPTION "password"
#define DATABASE_OPTION "database"
#define COLLECTION_OPTION "table"
#define MONGO_MAXTIMEMS_OPTION "maxTimeMs" //idle timeout
#define CONN_TIMEOUT_OPTION "connTimeout"
#define FIRST_PKT_TIMEO_OPTION "waitTimeout"
#define AUTHMODE_OPTION "authmode"

#define MONGO_MAXTIMEMS   ( 4 * 3600 * 1000UL );
#define CONN_TIMEOUT  ( 4 * 3600 * 1000UL );
#define FIRST_PACKET_WAIT_TIMEOUT  ( 4 * 3600 * 1000UL );


const SonarOption SonarOptions[] =
{
  /* foreign table options */
  { HOSTNAME_OPTION, ForeignTableRelationId },
  { PORT_OPTION, ForeignTableRelationId },
  { USER_OPTION, UserMappingRelationId},
  { PASSWORD_OPTION, UserMappingRelationId},
  { DATABASE_OPTION, ForeignTableRelationId },
  { COLLECTION_OPTION, ForeignTableRelationId },
  { AUTHMODE_OPTION, ForeignTableRelationId },
  { MONGO_MAXTIMEMS_OPTION, ForeignTableRelationId },
  { CONN_TIMEOUT_OPTION, ForeignTableRelationId },
  { FIRST_PKT_TIMEO_OPTION, ForeignTableRelationId },
  {NULL}
};

static const char *
sonar_get_option(const char *optname, Oid tbl);

static const char *
sonar_get_option(const char *optname, Oid tbl)
{
    ForeignTable *foreignTable = NULL;
    List *optionList = NIL;
    ListCell *optionCell = NULL;
    const char *val = NULL;

    foreignTable = GetForeignTable(tbl);

    optionList = list_concat(optionList, foreignTable->options);

    foreach(optionCell, optionList)
    {
        DefElem *optionDef = (DefElem *) lfirst(optionCell);
        char *optionDefName = optionDef->defname;

        if (strncmp(optionDefName, optname, NAMEDATALEN) == 0)
        {
            val = defGetString(optionDef);
            break;
        }
    }

    return val;
}


/** Get server port */
int
sonar_get_port(Oid tbl)
{
    const char *res = sonar_get_option(PORT_OPTION, tbl);
    return res ?  atoi( res ) : SONAR_PORT;
}

/** Get server address */
const char *
sonar_get_host(Oid tbl)
{
    const char *res = sonar_get_option(HOSTNAME_OPTION, tbl);
    return res ? res : "localhost";
}


/** Get server address */
const char *
sonar_get_mdb(Oid tbl)
{
    const char *res = sonar_get_option(DATABASE_OPTION, tbl);
    return res ? res : "test";
}


/** Get server address */
const char *
sonar_get_usr(Oid tbl)
{
    const char *res = sonar_get_option(USER_OPTION, tbl);
    return res ? res : "test";
}

/** Get server address */
const char *
sonar_get_authmode(Oid tbl)
{
    const char *res = sonar_get_option(AUTHMODE_OPTION, tbl);
    return res ? res : "CR";
}

/** Get server address */
const char *
sonar_get_pwd(Oid tbl)
{
    const char *res = sonar_get_option(PASSWORD_OPTION, tbl);
    return res ? res : "test";
}

/** Get server address */
const char *
sonar_get_collection(Oid tbl)
{
    const char *res = sonar_get_option(COLLECTION_OPTION, tbl);
    return res ? res : ( res = get_rel_name(  tbl  ) ) ?  res : "test";
}

/** Get server address */
int 
sonar_get_maxtimems(Oid tbl)
{
    const char *res = sonar_get_option(MONGO_MAXTIMEMS_OPTION, tbl);
    return res ? atoi( res ): MONGO_MAXTIMEMS;
}

int 
sonar_get_conn_timeout(Oid tbl)
{
    const char *res = sonar_get_option(CONN_TIMEOUT_OPTION, tbl);

    return res ? atoi( res ): CONN_TIMEOUT;
}

int 
sonar_get_wait_timeout(Oid tbl)
{
    const char *res = sonar_get_option(FIRST_PKT_TIMEO_OPTION, tbl);
    return res ? atoi( res ): FIRST_PACKET_WAIT_TIMEOUT;
}



