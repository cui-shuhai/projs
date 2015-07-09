
/*! sonar_func.h 
 *  posgres function call warpper  definitons
 *
 * Date: Thu Sep 18 11:29:00 PDT 2014
 * Author : CUI, SHU HAI
 */

#ifndef __SONAR_FUNC_H__
#define __SONAR_FUNC_H__

const char *
sf_get_func_name(  FuncExpr * func );

void  sf_fmgr_info(Oid functionId, FmgrInfo *finfo);

char * sf_substr( const char * s, int o, int l );

void sf_strdup( const char * str, char ** dst );

const char * sf_typ2str( void *val, int type );

#endif

