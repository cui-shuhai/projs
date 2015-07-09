
/*! sonar_join.h 
 * Explicit join query api defiitons
 *
 * Date: : Wed Sep 17 10:15:21 PDT 2014
 * Author : CUI, SHU HAI
 */

#ifndef __SONAR_JOIN_H__
#define __SONAR_JOIN_H__

bool 
sj_plan_scan( psc_private priv );


bool 
sj_plan_explain( psc_private priv ,
                                        ExplainState *es);

void
sj_scan( psc_private priv );
/** 
 * sonarIteratorForeignScan processing for DISTINCT query
 */
TupleTableSlot *
sj_iterate(ForeignScanState *node );


bool sj_sonar_join( PlannerInfo *root,
                    RelOptInfo *baserel,
                    psc_private priv);
/** 
 * Begin Foreign Scan for QueryQuery 
 */

void sj_join_var( psc_private priv, Var **v, Var **jv, const char **op ); 
void sj_update_query( ForeignScanState *node, psc_private priv );

bool sj_current_var( psc_private priv, Var *v );

TupleTableSlot *
sj_export_tuples( void * p );

bool sj_join_field( PlannerInfo * root,
                    RelOptInfo * baserel,
                    Oid foreigntableid,
                    const char * n );

void 
sj_jns( 
        PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid);

void 
sj_jns2( 
        PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid);

bool
sj_is_join( PlannerInfo * root );

bool
sj_is_loop( PlannerInfo * root );

psc_private sj_join_private( psc_private priv, Index ji );

bool sj_on_left( JoinExpr *join_expr, RelOptInfo *baserel );
bool sj_on_left2( psc_private priv, Index *idx );

bson_t * sj_join_query( psc_private priv, Index idx );

bson_t * sj_fields( psc_private priv, Index idx );

bool sj_plan_rtr_rtr( psc_private priv, JoinExpr *jx, bson_t *pipe, array_unit *au);
bool sj_plan_jxpr_rtr( psc_private priv, JoinExpr *jx, bson_t *pipe, array_unit *au);
#endif

