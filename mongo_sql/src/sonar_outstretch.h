/** sonar_outstretch.h:
 * definition for plann scan  helper functions:
 *
 *
 * Created on: Tue Sep 16 09:31:03 PDT 2014
 * Author  CUI, Shu Hai
 * 
 */


#ifndef __SONAR_CB_HEPER_H__
#define __SONAR_CB_HEPER_H__

const void * so_copy_self( const SonarPrivate * from );

void so_init_private( PlannerInfo *root,
                     RelOptInfo *baserel,
                     psc_private *ppriv  );


void 
so_scan( psc_private priv, ForeignScanState *ss );

void 
so_scan_priv( psc_private priv );

void 
so_plan_scan( psc_private priv );

void 
so_plan_scan_priv( psc_private priv, Var* v, Datum d );

void 
so_plan_rescan_priv( psc_private priv, Var* v, Datum d );

void
so_plan_rescan2_priv( psc_private priv, Param* p, Const *c );

void
so_negociate_relsize(PlannerInfo *root,
        RelOptInfo *baserel );

bool so_implicit_join( PlannerInfo *root );

void so_init_planstate( 
        PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid);

int so_connect_extern( SonarPlanState *ps_priv );

void so_init_node( SonarPlanState *ps_priv );

void so_limitoffset( psc_private priv );

void so_limitcount( psc_private priv );

void so_remove_substr_qual( ForeignScanState *ss );
#endif
