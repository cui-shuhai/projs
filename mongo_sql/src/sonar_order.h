#ifndef __SONAR_ORDER_H__
#define __SONAR_ORDER_H__

/**
*  sonarGetForeignPlan procressing for ORDER query
*/
int so_order_bson( psc_private priv );

bool
so_order_byopxpr( psc_private priv, bson_t *b,  OpExpr *opxpr, const char *operator );
#endif
