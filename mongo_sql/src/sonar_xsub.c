/*! sonar_xsub.c * xsub helper function definition
 * Date: : Fri Jan  2 16:08:51 PST 2015
 * Author : CUI, SHU HAI
 */
#include "sonar_utils.h"
#include "sonar_nm.h"
#include "sonar_log.h"
#include "sonar_join.h"
#include "sonar_mis.h"

#include "sonar_restriction.h"
#include "sonar_pg.h"
#include "sonar_tts.h"
#include "sonar_agg.h"
#include "sonar_group.h"
#include "sonar_query.h"
#include "sonar_distinct.h"
#include "sonar_order.h"
#include "sonar_subquery.h"
#include "sonar_xsub.h"
#include "sonar_bson.h"

 
TupleTableSlot * sx_export_tuples( void * p );

bool 
sx_plan_scan( psc_private priv )
{
	//int rc = 0;
	PlannerInfo *root = priv->root;

    priv->fn = sx_export_tuples;

    // is outest query, plan otherwise cleanup and reture;
    if( root->parse->hasSubLinks )
    {
        FromExpr * jointree = root->parse->jointree;

        if( IsA( jointree, FromExpr ) )
        {
            FromExpr *fxr = jointree;
            List *fromlist = fxr->fromlist;
            if( fromlist->length == 1 )
            {
                Expr *expr = lfirst( fromlist->head );
                RelOptInfo* baserel = priv->baserel;


                if( IsA( expr, JoinExpr ) )
                {
                    bson_t mb;
                    bson_t om;
                    bson_t sbp;
                    JoinExpr *join_expr = (JoinExpr*) expr;
                    Node *larg = join_expr->larg;
                    Node *rarg = join_expr->rarg;
                    Node * quals = join_expr->quals;

                    priv->g = bson_new();

                    BSON_APPEND_ARRAY_BEGIN( priv->g,"pipeline", &sbp );
                    BSON_APPEND_DOCUMENT_BEGIN( &sbp,"0", &om );
                    BSON_APPEND_DOCUMENT_BEGIN( &om,"$match", &mb );

                    if( IsA( larg, FromExpr ) && IsA(rarg, FromExpr ) )
                    { 
                        FromExpr *lrtr = (FromExpr*)larg;
                        List *lfromlist = lrtr->fromlist;
                        FromExpr *rrtr = (FromExpr*)rarg;
                        List *rfromlist = rrtr->fromlist;
                        if( lfromlist->length ==1 && rfromlist->length == 1 )
                        {
                            Node *lnode = lfirst( lfromlist->head );
                            Node *rnode = lfirst( rfromlist->head );

                            if( IsA( lnode, RangeTblRef ) && ((RangeTblRef*)lnode)->rtindex == baserel->relid )
                            {
                                bson_t bin;

                                if( IsA( rnode, RangeTblRef ) )
                                {
                                    sx_plan_rtr_rtr( priv, join_expr, &mb );
                                    if( !bson_empty0( priv->q ) )
                                        bson_concat( &mb, priv->q );
                                    bson_append_document_end( &om, &mb );
                                    bson_append_document_end( &sbp, &om );
                                    bson_append_array_end( priv->g, &sbp );
                                }
                                else if( IsA( rnode, JoinExpr ) )
                                {
                                    //RangeTblRef *rtr = (RangeTblRef*) lnode;
                                    JoinExpr *jx = (JoinExpr*) rnode;
                                    if( quals && IsA( quals, List ) )
                                    {
                                        List *l = (List*)quals;
                                        ListCell *c;
                                        foreach( c, l )
                                        {
                                            OpExpr *opexpr = lfirst( c );
                                            if( IsA( opexpr, OpExpr ) )
                                            {
                                                const char* opname = get_opname( opexpr->opno );

                                                if( strcmp( opname, "=" ) )
                                                    continue;

                                                if( opexpr->args->length == 2 )
                                                {
                                                    Expr *xr1  =  ( Expr * ) opexpr->args->head->data.ptr_value;
                                                    Expr *xr2  =  ( Expr * ) opexpr->args->head->next->data.ptr_value;
                                                    if( IsA( xr1, Var ) && IsA( xr2, Var ))
                                                    {
                                                        psc_private rpriv;
                                                        bson_t bns;
                                                        Var *v1 = (Var*)xr1;
                                                        Var *v2 = (Var*)xr2;
                                                        RelOptInfo *rel = root->simple_rel_array[ v2->varno ];
                                                        SonarPlanState *rps =  rel->fdw_private;
                                                        if( !rps )
                                                            return false;

                                                        if( IsA( rps, SonarPlanState ) )
                                                            rpriv = rps->scan_priv;
                                                        else if( IsA( rps, SonarPrivate ) ) 
                                                            rpriv = ( psc_private)rps;

                                                        //find v2 priv then got the collection name
                                                        BSON_APPEND_DOCUMENT_BEGIN( &mb, priv->nm[ v1->varattno -1].sn, &bin );
                                                        BSON_APPEND_DOCUMENT_BEGIN(&bin, "$in", &bns );
                                                        BSON_APPEND_UTF8( &bns, "$ns", rpriv->uri->collection_name );
                                                        sx_plan_rtr_jxpr( priv, jx, &bns );
                                                        BSON_APPEND_UTF8( &bns, "$p", rpriv->nm[ v2->varattno -1].sn );
                                                        bson_append_document_end( &bin, &bns);
                                                        bson_append_document_end( &mb, &bin );
                                                        bson_append_document_end( &om, &mb );
                                                        bson_append_document_end( &sbp, &om );
                                                        bson_append_array_end( priv->g, &sbp );
                                                    }
                                                }
                                                else
                                                {
                                                    sl_log( LOG, "sxplan_scan", "join opexpr length != 2");
                                                }
                                                 
                                            }
                                            else
                                                sl_log( LOG, "sxplan_scan", "quals not OpExpr tyep");



                                        }
                                    }
                                }
                            }
                            else
                            {
                                priv->t = query_invalid; 
                                sl_log( LOG, "sx_plan_scan", "none-left most subquery" );
                            }
                        }
                        else
                        {
                            sl_log( LOG_DESTINATION_STDERR, "sx_plan_scan", "unexpected JoinExpr: lfromlist->length ==1 && rfromlist->length ==1 is false ");
                        }

                    }
                    else  // Are there JoinExpr join JoinExpr, document seems say no
                    {
                        sl_log( LOG_DESTINATION_STDERR, "sx_plan_scan", "unexpected JoinExpr join JoinExpr");
                    }
                }
                else if( IsA( expr, RangeTblRef ) )
                {
                    RangeTblRef *rtr = (RangeTblRef*) expr;
                    if( rtr->rtindex == baserel->relid )
                    {
                        bson_t om;
                        bson_t sbp;
                        //JoinExpr *join_expr = (JoinExpr*) expr;
                        //Node *larg = join_expr->larg;
                        //Node *rarg = join_expr->rarg;
                        //Node * quals = join_expr->quals;

                        priv->g = bson_new();

                        BSON_APPEND_ARRAY_BEGIN( priv->g,"pipeline", &sbp );
                        BSON_APPEND_DOCUMENT_BEGIN( &sbp,"0", &om );

                        BSON_APPEND_DOCUMENT( &om,"$match", priv->q );

                        bson_append_document_end( &sbp, &om );
                        bson_append_array_end( priv->g, &sbp );

                    }

                }


            }
            else
            {
                sl_log( LOG_DESTINATION_STDERR, "sx_plan_scan", "jointree->fromlist->length != 1");
            }
        }
        else
        {
            sl_log( LOG_DESTINATION_STDERR, "sx_plan_scan", "parse->jointree is not FromExpr type");
        }
    }

	return false;
}
 

bool 
sx_plan_explain( psc_private priv ,
				 ExplainState *es)
{
	return true;
}


void
sx_scan( psc_private priv )
{
    if( priv->g && priv->uri->cursor == 0 )
    {
        priv->ttsdesc = sonar_create_group_ttsdesc( priv->id,  priv->L ); 
        priv->fn = sx_export_tuples;
        su_aggregate( priv );
    }
}


/** 
* sonarIteratorForeignScan processing for DISTINCT query
*/
TupleTableSlot *
sx_iterate(ForeignScanState *node )
{
	ForeignScan *scanstate = (ForeignScan *) node->ss.ps.plan;
	psc_private priv = lfirst( scanstate->fdw_private->head ); 
	TupleTableSlot *slot = node->ss.ss_ScanTupleSlot;

    if( !priv->uri->cursor )
        return 0;

    node->ss.ps.state->es_private = ( ResultRelInfo *)  priv ;
	memset( slot->tts_values, 0, slot->tts_tupleDescriptor->natts * sizeof(Datum));

	ExecClearTuple(slot);
	return 0;
}
																																				  


TupleTableSlot *
sx_export_tuples( void * p )
{
	psc_private  priv = (psc_private ) p;
	TupleTableSlot * tts = 0 ; 

	const bson_t *r;

    if( priv->uri->cursor == 0 )
        return 0;

	if( mongoc_cursor_next( priv->uri->cursor, &r ) )
	{
		ListCell *c;

		tts = MakeTupleTableSlot(); 
		ExecSetSlotDescriptor( tts, priv->ttsdesc ); /* new tuple descriptor */
		memset( tts->tts_values, 0, tts->tts_tupleDescriptor->natts * sizeof(Datum));
		memset( tts->tts_isnull, true, tts->tts_tupleDescriptor->natts * sizeof(bool));

		tts->tts_isempty = 0;

		tts->tts_nvalid = list_length( priv->L );

		foreach( c, priv->L )
		{
			TargetEntry *e = ( TargetEntry*)lfirst( c );
			
			char  fn[NAMEDATALEN] = {0};
			int ci;
			Expr *expr = e->expr;


			ci = e->resno -1 ;

			if( ci >= tts->tts_tupleDescriptor->natts )
				continue;

			tts->tts_tupleDescriptor->attrs[ci]->attrelid = priv->id; 
				
			if( IsA( expr, Var ) )
			{
				RelOptInfo *baserel = priv->baserel;
				Var *v = ( Var*) expr;

				if( v->varno == baserel->relid )
				{
					sprintf( fn, "%s", priv->nm[ v->varattno -1 ].sn );
					if( !( su_mongo_pg_map( r, tts, ci,  fn ) || su_mp_descend_map( r, tts, ci, fn) ) )
					{
						tts->tts_isnull[ ci ] = true;
					}
				}

			}
			else
			{
				 tts->tts_isnull[ ci ] = true;
				 //sl_log( "find vallue failed\n", fn  );
			}
		}

	}
	else //reset the cursor
	{
		mongoc_cursor_destroy( priv->uri->cursor );
		priv->uri->cursor = 0;

		sx_scan( priv );
	}
	return tts;
}


bool sx_is_xsub(PlannerInfo *root,
                RelOptInfo *baserel,
                psc_private priv)
{
    int rc = false;
   
    // check if subquery
    //if(  root->hasJoinRTEs == 0 && root->parse->jointree && root->parse->jointree->fromlist && root->parse->jointree->fromlist->length > 1 )
    if( ss_is_subquery( root, baserel, priv ) )
    {
        // check if sonardb
        if( su_sonardb( root, baserel, priv ) )
        {
            priv->t = query_xsub;
            rc = true;
        }
    }
    return rc;
}

void sx_plan_rtr_rtr(psc_private priv,
                    JoinExpr *join_expr,
                    bson_t *obin)
{
    //bson_t bsub;
    psc_private lpriv;
    psc_private rpriv;
    PlannerInfo *root = priv->root;
    //RelOptInfo* baserel = priv->baserel;
    Node * quals = join_expr->quals;

    FromExpr *lrtr = (FromExpr*)join_expr->larg;
    List *lfromlist = lrtr->fromlist;
    FromExpr *rrtr = (FromExpr*)join_expr->rarg;
    List *rfromlist = rrtr->fromlist;

    RangeTblRef *lnode = (RangeTblRef*)lfirst( lfromlist->head );
    RangeTblRef *rnode = (RangeTblRef*)lfirst( rfromlist->head );

    RelOptInfo *lrel = root->simple_rel_array[ lnode->rtindex ];
    RelOptInfo *rrel = root->simple_rel_array[ rnode->rtindex ];

    SonarPlanState *lps =  lrel->fdw_private;
    SonarPlanState *rps =  rrel->fdw_private;
    if( !lps || !rps )
        return;

    if( IsA( lps, SonarPlanState ) )
        lpriv = lps->scan_priv;
    else if( IsA( lps, SonarPrivate ) ) 
        lpriv = (psc_private )lps;

    if( IsA( rps, SonarPlanState ) )
        rpriv = rps->scan_priv;
    else if( IsA( rps, SonarPrivate ) ) 
        rpriv = (psc_private)rps;

    if( IsA( quals, List ) )
    {
        bson_t bin;
        bson_t bns;
        List *l = (List*)quals;
        if( l->length == 1 )
        {
            Expr *x = lfirst( l->head );
            if( IsA( x, OpExpr ) )
            {
                OpExpr *opexpr = (OpExpr*)x;
                const char* opname = get_opname( opexpr->opno );

                if( strcmp( opname, "=" ) == 0 )
                {
                    if( opexpr->args->length == 2 )
                    {
                        Expr *xr1  =  ( Expr * ) opexpr->args->head->data.ptr_value;
                        Expr *xr2  =  ( Expr * ) opexpr->args->head->next->data.ptr_value;

                        if( IsA( xr1, Var ) && IsA( xr2, Var ))
                        {
                            Var *v1 = (Var*)xr1;
                            Var *v2 = (Var*)xr2;

                            BSON_APPEND_DOCUMENT_BEGIN( obin, lpriv->nm[ v1->varattno -1].sn, &bin );
                            BSON_APPEND_DOCUMENT_BEGIN(&bin, "$in", &bns );
                            BSON_APPEND_UTF8( &bns, "$ns", rpriv->uri->collection_name );
                            BSON_APPEND_DOCUMENT( &bns, "$q", rpriv->q );
                            BSON_APPEND_UTF8( &bns, "$p", rpriv->nm[ v2->varattno -1].sn );
                            bson_append_document_end( &bin, &bns);
                            bson_append_document_end( obin, &bin );
                        }
                    }
                    else
                    {
                        sl_log( LOG, "sx_plan_rtr_rtr", "opexpr args length != 2");
                    }
                }
            }
        }
    }
}

void sx_plan_rtr_jxpr(psc_private priv,
                    JoinExpr *jx,
                    bson_t *bin)
{
    //RelOptInfo* baserel = priv->baserel;
    Node *larg = jx->larg;
    Node *rarg = jx->rarg;
    //Node * quals = jx->quals;

    if( IsA( larg, FromExpr ) && IsA(rarg, FromExpr ) )
    { 
        FromExpr *lrtr = (FromExpr*)larg;
        List *lfromlist = lrtr->fromlist;
        FromExpr *rrtr = (FromExpr*)rarg;
        List *rfromlist = rrtr->fromlist;
        if( lfromlist->length ==1 && rfromlist->length == 1 )
        {
            Node *lnode = lfirst( lfromlist->head );
            Node *rnode = lfirst( rfromlist->head );

            if( IsA( lnode, RangeTblRef ) )
            {
                if( IsA( rnode, RangeTblRef ) )
                {
                    bson_t bsub;
                    BSON_APPEND_DOCUMENT_BEGIN( bin, "$q", &bsub );
                    sx_plan_rtr_rtr( priv, jx, &bsub);
                    bson_append_document_end( bin, &bsub );
                }
                else if( IsA( rnode, JoinExpr ) )
                {
                    //RangeTblRef *rtr = (RangeTblRef*) lnode;
                    //JoinExpr *join_expr = (JoinExpr*) rnode;
                    //psc_private rpriv;
                    //bson_t bns;
#if 0
                    Var *v1 = (Var*)xr1;
                    Var *v2 = (Var*)xr2;
                    RelOptInfo *rel = root->simple_rel_array[ v2->varno ];
                    SonarPlanState *rps =  rel->fdw_private;
                    if( !rps )
                        return;

                    if( IsA( rps, SonarPlanState ) )
                        rpriv = rps->scan_priv;
                    else if( IsA( rps, SonarPrivate ) ) 
                        rpriv = rps;

                    //find v2 priv then got the collection name
                    BSON_APPEND_DOCUMENT_BEGIN( priv->g, priv->nm[ v1->varattno -1].sn, &bin );
                    BSON_APPEND_DOCUMENT_BEGIN(&bin, "$in", &bns );
                    BSON_APPEND_UTF8( &bns, "$ns", rpriv->uri->collection_name );
                    sx_plan_rtr_jxpr( priv, jx, &bns );
                    BSON_APPEND_UTF8( &bns, "$p", rpriv->nm[ v2->varattno -1].sn );
                    bson_append_document_end( &bin, &bns);
                    bson_append_document_end( priv->g, &bin );
#endif
                }
            }
        }
    }
}
