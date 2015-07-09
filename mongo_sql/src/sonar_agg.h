#ifndef __SONAR_AGG_H__
#define __SONAR_AGG_H__

typedef enum sonar_sql_agg_operation
{
	SONAR_AGG_COUNT = 1 << 0,
	SONAR_AGG_MAX = 1 << 1,
	SONAR_AGG_MIN = 1 << 2,
	SONAR_AGG_AVG = 1 << 3,
	SONAR_AGG_SUM = 1 << 4,
	SONAR_AGG_PARAM = 1 << 5,

} sonar_agg_enum;

typedef struct sonar_agg_result_bson
{
    Node n;
	sonar_agg_enum e;
    int16 resno;
    Oid  t; //type
	Datum d;  /* aggregation result */ 
} sa_result_data, *sa_result;

typedef sa_result_data SonarAggResult;

bool 
sa_plan_scan( psc_private  priv, Var* v, Datum d );


bool 
sa_plan_rescan( psc_private  priv, Var* v, Datum d );
sa_result sonar_make_agg_node( sonar_agg_enum e, int16 res, Oid t );


/**
* sonarIteratorForeignScan processing for aggregation
*/
TupleTableSlot *
sa_iterate(ForeignScanState *node);

/** 
 * Begin Foreign Scan for Agg Query
 */
void
sa_scan( psc_private priv );


List * sonarGetAggQuery( PlannerInfo *root );
#endif
