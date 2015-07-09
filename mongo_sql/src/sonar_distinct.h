#ifndef __SONAR_DISTINCT_H__
#define __SONAR_DISTINCT_H__


/**
*  sonarGetForeignPlan procressing for DISTINCT query
*/
int sd_plan_scan( psc_private  priv, Var* v, Datum d );

int sd_plan_rescan( psc_private  priv, Var* v, Datum d );
/** 
 * sonarIteratorForeignScan processing for DISTINCT query
 */
TupleTableSlot *
sd_iterate(ForeignScanState *node );
/** 
 * Begin Foreign Scan for Distinct Query
 */
void
sd_scan( psc_private priv );
#endif
