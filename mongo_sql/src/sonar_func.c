
/*! sonar_func.c 
 *  posgres function call warpper definiton 
 * Date: Thu Sep 18 11:29:00 PDT 2014
 * Author : CUI, SHU HAI
 */
#include "sonar_utils.h"
#include "sonar_nm.h"
#include "sonar_log.h"
#include "sonar_join.h"
#include "sonar_mis.h"

#include "sonar_restriction.h"
#include "sonar_pg.h"
#include "sonar_agg.h"
#include "sonar_group.h"
#include "sonar_query.h"
#include "sonar_distinct.h"
#include "sonar_order.h"
#include "sonar_func.h"



const char *
sf_get_func_name(  FuncExpr * xpr )
{
    return  get_func_name( xpr->funcid ); 
}

void  sf_fmgr_info(Oid functionId, FmgrInfo *finfo)
{
    fmgr_info( functionId, finfo);
}

char * sf_substr( const char * s, int o, int l )
{
     char *nstr;
     nstr = (char *) malloc( l +1 );
     memset( nstr, 0, l + 1 );
     memcpy(nstr, s + o, l);
     return nstr;
}


void sf_strdup( const char * str, char ** dst )
{
     char *nstr;
     Size len = strlen(str) + 1;
     nstr = (char *) malloc( len);
     memset( nstr, 0, len -1 );
     memcpy(nstr, str, len);
     *dst = nstr;
}


const char * sf_typ2str( void *val, int type )
{
    char * const result = 0;

    switch( type )
    {
        case INT8OID : 
        {
            break;
        }
        default:
        break;
    }

    return result;
}
