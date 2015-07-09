
/*! sonar_fbson.h  
 * Date: : Fri Feb  6 10:21:23 PST 2015
 * Author : CUI, SHU HAI
 */


#ifndef __SONAR_FBSON_H__
#define __SONAR_FBSON_H__

void sf_opcat_bson( psc_private priv,  bson_t *b, OpExpr* opxpr );
void sf_opmath_bson( psc_private priv,  bson_t *b, OpExpr* opxpr );
void sf_substr_bson( psc_private priv,  bson_t *b, FuncExpr* fxpr );
void sf_lowerupper_bson( psc_private priv,  bson_t *b, FuncExpr* fxpr );
#endif

