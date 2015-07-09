
#ifndef __SONAR_NM_H__
#define __SONAR_NM_H__

/**********************************************************
 * 
 * this file contains type and API definition for 
 * postgresql to sonar name map 
 ********************************************************/
/** table column name map hash 
*/


void sn_collect_interests( psc_private priv );

void sonar_nm_release( psc_private priv );

void su_collect_opexpr_interests( 
                    psc_private priv,
                    OpExpr *opxpr );

void su_collect_funcexpr_interests( 
                    psc_private priv,
                    FuncExpr *funxpr );

Spnm sn_build_nm( psc_private priv );
#endif
