/*! sonar_subquery.c * subquery helper function definition
 * Date: : Wed Sep 17 10:15:21 PDT 2014
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
#include "sonar_subquery.h"
#include "sonar_bson.h"


bool ss_is_subquery(PlannerInfo *root,
                   RelOptInfo *baserel,
                   psc_private priv)
{
    FromExpr *fxr = root->parse->jointree;
    List *fromlist;

    ListCell *from;
    
    if( !fxr )
        return false;

    fromlist = fxr->fromlist;
    /// Join expr is only useful for JOIN_SEMI and SOIN_ANTI
    /// No explicit nor implicit join works here

    foreach( from, fromlist ) // fromlist->quals == 0
    {
        Expr *rxpr = lfirst( from );
        if( IsA( rxpr, JoinExpr ) )
        {
            JoinExpr *join_expr = ( JoinExpr * )rxpr;

            if( join_expr->jointype != JOIN_SEMI && join_expr->jointype != JOIN_ANTI )
                continue;

            if( join_expr->quals )
            {
                ListCell *qual;

                foreach( qual, (List*) join_expr->quals )
                {
                    Expr *x = ( Expr*) lfirst( qual );

                    if( IsA( x, OpExpr ) )
                    {
                        OpExpr *oxpr = (OpExpr *) x;
                        List *args = oxpr->args;

                        if( strcmp( get_opname( oxpr->opno ) , "=" ) == 0 )
                        {
                            Var *vl = lfirst( args->head );
                            Var *vr = lfirst( args->head->next );
                            if( IsA( vl, Var ) && IsA( vr, Var ) )
                            {
                                if( vl->varno != vr->varno )
                                {
                                    if( baserel->relid == vl->varno || baserel->relid == vr->varno )
                                        return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        else if( IsA( rxpr, RangeTblRef ) && fromlist->length == 1 )
        {
              if( root->parent_root )
              {
                  PlannerInfo *parent = root->parent_root;
                  if( parent->simple_rel_array_size == 2 )
                  {
                      RelOptInfo *rel = parent->simple_rel_array[ 1];
                      if( rel->rtekind != RTE_SUBQUERY )
                        return true;
                  }

              }
        }
    }

    return false;
}

bool ss_is_outquery(PlannerInfo *root,
                   RelOptInfo *baserel,
                   psc_private priv)
{
    return root->glob->subroots != 0;
}


//XXX there maybe something to improve, for example there is more than one under subroots, 
bool ss_subquery_private( psc_private priv, PlannerInfo **subroot )
{
    PlannerInfo *root = priv->root;
    ListCell *c;

    if( root->glob->subroots )
    {
        foreach( c, root->glob->subroots )
        {
            *subroot = lfirst( c );
            return true;
        }
    }

    return false;
}
