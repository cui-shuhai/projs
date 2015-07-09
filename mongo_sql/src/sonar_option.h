
/* sonar_option.h -- Foreign Table Extension options interface API
 * Date: : Fri Dec 12 15:15:15 PST 2014
 * Author : CUI, SHU HAI
**/
#ifndef __SONAR_OPTION_H__
#define __SONAR_OPTION_H__


typedef struct SonarOption
{
  const char *name;
  Oid context;

} SonarOption;

int
sonar_get_port(Oid tbl);

const char *
sonar_get_host(Oid tbl);

const char *
sonar_get_mdb(Oid tbl);

const char *
sonar_get_usr(Oid tbl);

const char *
sonar_get_authmode(Oid tbl);

const char *
sonar_get_pwd(Oid tbl);

const char *
sonar_get_collection(Oid tbl);

int
sonar_get_maxtimems(Oid tbl);

int
sonar_get_conn_timeout(Oid tbl);

int 
sonar_get_wait_timeout(Oid tbl);

#endif
