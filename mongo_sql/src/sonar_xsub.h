
/*! sonar_xsub.h 
 *  xsub helper api definitons
 *
 * Date: : Fri Jan  2 16:08:51 PST 2015
 * Author : CUI, SHU HAI
 */

#ifndef __SONAR_SUB_H__
#define __SONAR_SUB_H__

bool 
sx_plan_scan( psc_private priv );


bool 
sx_plan_explain(psc_private priv ,
                ExplainState *es);

void
sx_scan( psc_private priv );
/** 
 * sonarIteratorForeignScan processing for DISTINCT query
 */
TupleTableSlot *
sx_iterate(ForeignScanState *node );



TupleTableSlot *
sx_export_tuples( void * p );

bool sx_is_xsub(PlannerInfo *root,
                RelOptInfo *baserel,
                psc_private priv);

void sx_plan_rtr_rtr(psc_private priv,
                    JoinExpr *jx,
                    bson_t *pipe);

void sx_plan_rtr_jxpr(psc_private priv,
                    JoinExpr *jx,
                    bson_t *pipe);
#endif

