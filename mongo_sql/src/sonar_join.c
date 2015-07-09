/*! sonar_join.c 
 * Explicit join query api implementation 
 *
 * Date: : Fri Dec 12 15:15:15 PST 2014
 * Author : CUI, SHU HAI
 */

#include "sonar_utils.h"
#include "sonar_func.h"
#include "sonar_tts.h"
#include "sonar_nm.h"
#include "sonar_log.h"
#include "sonar_list.h"
#include "sonar_mis.h"
#include "sonar_func.h"

#include "sonar_restriction.h"
#include "sonar_pg.h"
#include "sonar_agg.h"
#include "sonar_group.h"
#include "sonar_query.h"
#include "sonar_distinct.h"
#include "sonar_order.h"
#include "sonar_join.h"
#include "sonar_outstretch.h"

 
bool 
sj_plan_scan( psc_private priv )
{
	int rc = 0;
    bool bout = false;
	PlannerInfo *root = priv->root;
	FromExpr *fxr = ( FromExpr*)root->parse->jointree;
	List *fromlist = fxr->fromlist;

	array_unit au = {0};
	bson_t sbp;
	//bson_t pnode;

	if( priv->g )
		return true;


	priv->g = bson_new();
	
	rc = BSON_APPEND_ARRAY_BEGIN( priv->g, "pipeline", &sbp );

    if( !bson_empty0( priv->f ) )
        su_push_docval_in_array( &sbp, &au, "$project", priv->f );

    if( !bson_empty( priv->q ) )
        su_push_docval_in_array( &sbp, &au, "$match", priv->q );

	if( fromlist && fromlist->length == 1 )
	{
		Expr *expr = lfirst( fromlist->head );

		if( IsA( expr, JoinExpr ) )
		{
			RelOptInfo* baserel = priv->baserel;
			JoinExpr *join_expr = (JoinExpr*) expr;
			Node *larg = join_expr->larg;
			Node *rarg = join_expr->rarg;
			Node * quals = join_expr->quals;

			if( IsA( larg, RangeTblRef ) && IsA(rarg, RangeTblRef ) )
			{ 
				RangeTblRef *lrtr = (RangeTblRef*)larg;
				//RangeTblRef *rrtr = (RangeTblRef*)rarg;

				if( IsA( quals, List )) 
				{
					if( lrtr->rtindex == baserel->relid )
					{
                        bout = true;
						sj_plan_rtr_rtr( priv, join_expr, &sbp, &au );
					}
				}
			}
			else if( IsA( larg, JoinExpr) && IsA(rarg, RangeTblRef) ) 
			{
				if( IsA( quals, List ) )
				{
                    bson_t jnn;
                    bson_t jn;
                    bson_t jm;
                    bson_t jp;
                    bson_t jpm;
                    psc_private rpriv;
				    const char* idx;

					ListCell *c;
					List *list = (List*) quals;
					JoinExpr *jxpr = (JoinExpr *) larg;
					RangeTblRef *rrtr = (RangeTblRef*)rarg;
                    RelOptInfo *rbaserel =  root->simple_rel_array[ rrtr->rtindex ];
                    SonarPlanState *rps =  rbaserel->fdw_private;

                    if( !rps )
                        return false;

                    if( IsA( rps, SonarPlanState ) )
                        rpriv = rps->scan_priv;
                    else if( IsA( rps, SonarPrivate ) ) 
                        rpriv = ( psc_private)rps;

					if( rrtr->rtindex == baserel->relid )
                    {
						priv->jpos |= 2;
                        bson_destroy( priv->g );
                        priv->g = 0;
                        return false;
                    }

					if( !sj_plan_jxpr_rtr( priv, jxpr, &sbp, &au ) )
                    {
                        bson_destroy( priv->g );
                        priv->g = 0;
                        return false;
                    }

                    idx = array_index( &au );
                    rc = BSON_APPEND_DOCUMENT_BEGIN( &sbp, idx, &jnn ); 

                    rc = BSON_APPEND_DOCUMENT_BEGIN( &jnn, "$join", &jn );
                    ASSERT_BSON_OK( rc );

                    rc = BSON_APPEND_UTF8( &jn,  "$as", rpriv->uri->collection_name );
                    ASSERT_BSON_OK( rc );

                    rc = BSON_APPEND_UTF8( &jn,  "$joined", rpriv->uri->collection_name );
                    ASSERT_BSON_OK( rc );

                    rc = BSON_APPEND_INT32( &jn,  "$multi", 3 );
                    ASSERT_BSON_OK( rc );

                    if( !bson_empty0( rpriv->q ) )
                    {
                        rc = BSON_APPEND_DOCUMENT( &jn, "$selector", rpriv->q );
                        ASSERT_BSON_OK( rc );
                    }
                 

                    rc = BSON_APPEND_DOCUMENT_BEGIN( &jn, "$match", &jm );
                    ASSERT_BSON_OK( rc );
					// match 
					foreach( c, list )
					{
                        Expr *expr = lfirst( c );
                        
                        if( IsA( expr, OpExpr ) )
                        {
                            OpExpr* opexpr = (OpExpr*) expr;
                            List *args = opexpr->args;

                            if( !args )
                                continue;

                            if( args->length == 2 )
                            {
                                char join_field[ NAMEDATALEN ] = {0}; 
                                psc_private xtmp = 0;

                                Var *vl = lfirst( args->head );
                                Var *vr = lfirst( args->head->next );

                                if( IsA( vl, Var ) && IsA( vr, Var ) )
                                {
                                    su_find_private( root, vl->varno, &xtmp );

                                    if( xtmp == rpriv )
                                    {
                                         vr = lfirst( args->head );
                                         vl = lfirst( args->head->next );
                                        su_find_private( root, vl->varno, &xtmp );
                                    }

                                    sprintf( join_field, "$%s.$%s", rpriv->uri->collection_name, rpriv->nm[ vr->varattno -1 ].sn );
                                    //sf_strdup( join_field, (char**)&priv->js );
                                    //memset( join_field, 0, NAMEDATALEN );
                                    //sprintf( join_field, "$%s.$%s", priv->uri->collection_name, priv->nm[ vl->varattno -1 ].sn );

                                    rc = BSON_APPEND_UTF8( &jm,  xtmp->nm[ vl->varattno - 1 ].sn , join_field );
                                    ASSERT_BSON_OK( rc );
                                }
                            }
                        }
					}

                    bson_append_document_end( &jn, &jm );
                    rc = BSON_APPEND_ARRAY_BEGIN( &jn, "$project", &jp );
                    if( rc )
                    {
                        array_unit au = { 0 };
                        const char* idx;
                        ListCell *c;
                        foreach( c, rpriv->l )
                        {
                            Var* v = ( Var*)lfirst( c );
                            idx = array_index( &au );
                            rc = BSON_APPEND_UTF8( &jp, idx, rpriv->nm[ v->varattno -1 ].sn );
                            ASSERT_BSON_OK( rc );
                        }
                    }

                    bson_append_array_end( &jn, &jp );
                    bson_append_document_end( &jnn, &jn );
                    bson_append_document_end( &sbp, &jnn );
				}
			}
			else  // Are there JoinExpr join JoinExpr, document seems say no
			{
                sl_log( INFO, "Warning:", "sj_plan_scan unprocessed JoinExpr \n" );
			}
		}


	}
	bson_append_array_end( priv->g, &sbp );

    if( !bout && priv->jpos != 1 )
    {
        bson_destroy( priv->g );
        priv->g = 0;
    }

	return false;
}
 

bool 
sj_plan_explain( psc_private priv ,
				 ExplainState *es)
{
	return true;
}


void
sj_scan( psc_private priv )
{
	priv->ttsdesc = sonar_create_group_ttsdesc( priv->id,  priv->L ); 
	priv->fn = sj_export_tuples;

	if( priv->g )
	{
        if( !priv->gq )
            priv->gq = bson_new();

		su_aggregate( priv );
	}
}
/** 
* sonarIteratorForeignScan processing for DISTINCT query
*/
TupleTableSlot *
sj_iterate(ForeignScanState *node )
{
	return 0;
}
																																				  


TupleTableSlot *
sj_export_tuples( void * p )
{
    struct sigaction old;
    psc_private  priv= 0;
	psc_private  xxp = (psc_private ) p;
    PlannerInfo *root = xxp->root;
    List *privs = (List*) root->join_search_private;
    ListCell *c;
	TupleTableSlot * tts = 0 ; 

	const bson_t *r;

//	if( xxp->jpos != 2 || privs == 0)
//		return 0;

    foreach( c, privs )
    {
        psc_private p = (psc_private) lfirst( c );
        if( p->jpos == 1 )
        {
            priv = p;
            break;
        }
    }
	
    sp_suspend_signal( SIGALRM, &old ); 
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
				else
				{
					psc_private joinpriv = sj_join_private( priv, v->varno );
                    sprintf( fn, "%s.%s",  joinpriv->uri->collection_name, joinpriv->nm[ v->varattno -1 ].sn );
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

		sj_scan( priv );
	}
    sp_resume_signal( SIGALRM, &old ); 
	return tts;
}


void sj_join_var( psc_private priv,
		 Var **v,
		 Var **jv,
		 const char **op )
{
	PlannerInfo *root = priv->root;
	RelOptInfo *baserel = priv->baserel;

	RelOptInfo * tbr;
	
	if( root->hasJoinRTEs )
	{
		FromExpr * fxpr ;
		ListCell *c;

		fxpr = ( FromExpr*) root->parse->jointree;
		foreach( c, fxpr->fromlist )
		{
			JoinExpr *jxpr = lfirst( c );

			List *l = (List * )jxpr->quals;

			if( l )
			{
				ListCell *jc;
				foreach( jc, l )
				{
					OpExpr * oxpr = ( OpExpr * )lfirst( jc );

					if( oxpr->args &&  oxpr->args->length == 2 )
					{
						Var *v1 = lfirst( oxpr->args->head );
						Var *v2 = lfirst( oxpr->args->head->next );
						if( IsA( v1, Var) && IsA( v2, Var ) )
						{
							tbr = find_base_rel( root, v1->varno );
							if( tbr == baserel )
							{
							   *v = v1;
							   *jv = v2; 
							}
							else
							{
								*v = v2;
								*jv = v1;
							}
							*op = get_opname( oxpr->opno ); 
							return;
						}

					}
				}
			}
		}
	}
	else if( root->parse->jointree )
	{
		FromExpr * fxpr = ( FromExpr*) root->parse->jointree;

		if( fxpr->fromlist->length ==2 )
		{
			RangeTblRef *rtr1 = lfirst( fxpr->fromlist->head );
			RangeTblRef *rtr2 = lfirst( fxpr->fromlist->head->next );

			if( IsA( rtr1, RangeTblRef ) && IsA( rtr2, RangeTblRef ) )
			{
				List *l = ( List*)fxpr->quals;

				if( l &&  IsA( l, List )  )
				{
					ListCell *c;
					foreach( c , l)
					{
						OpExpr *oxpr = lfirst( c );
						if( IsA( oxpr, OpExpr ) )
						{
							if( oxpr->args->length == 2 )
							{
								Var* vl = lfirst( oxpr->args->head );
								Var* vr = lfirst( oxpr->args->head->next );

								if( IsA( vl, Var ) && IsA( vr, Var ) && vl->varno != vr->varno )
								{
									if( find_base_rel( root, vl->varno ) == baserel )
									{
										*v = vl;
										*jv = vr;
									}
									else
									{
										*v = vr;
										*jv = vl;
									}
								}

								*op = get_opname( oxpr->opno ); 
							}

						}
					}

				}
			}
		}
		else if( fxpr->fromlist->length == 1 ) //here seems joins local table
		{
			RangeTblRef *rtr = lfirst( fxpr->fromlist->head );

			if( IsA( rtr, RangeTblRef ) )
			{
				List *l = ( List*)fxpr->quals;

				if( l &&  IsA( l, List )  )
				{
					ListCell *c;
					foreach( c , l)
					{
						OpExpr *oxpr = lfirst( c );

						if( IsA( oxpr, OpExpr ) )
						{

							if( oxpr->args->length == 2 )
							{
								//Param* param = lfirst( oxpr->args->head );
								* v = lfirst( oxpr->args->head );
								//Const * cnst = lfirst( oxpr->args->head->next );
								*jv = lfirst( oxpr->args->head->next );

								*op = get_opname( oxpr->opno ); 
							}

						}
					}
				}
			}
		}
	}
}


void sj_update_query( ForeignScanState *node, psc_private priv )
{
	Var *v = 0, *jv = 0;
	const char  *opname = 0;

	sj_join_var( priv, &v, &jv, &opname);


	if( v && jv && opname && strcmp( opname, "=" ) == 0 )
	{
		if( IsA( v, Var ) && IsA( jv, Var ) )
		{
			psc_private p = sj_join_private( priv, jv->varno );
			if( p )
			{
				TupleTableSlot *slot = p->js; 
				if( slot )
				{
					Datum d = slot->tts_values[ jv->varattno -1 ]; 
					so_plan_rescan_priv( priv, v, d );
				}
			}
		}
		else if( IsA( v, Param ) && IsA( jv, Const ) )
		{
			so_plan_rescan2_priv( priv, (Param*)v, ( Const*)jv );
		}
	}
}

bool sj_current_var( psc_private priv, Var *v )
{
	PlannerInfo *root = priv->root;
	RelOptInfo *baserel = priv->baserel;

	return ( baserel == find_base_rel( root, v->varno ) );
}

bool sj_join_field( PlannerInfo * root,
					RelOptInfo *baserel,
					Oid foreigntableid,
					const char * n )
{
	FromExpr * fxpr ;
	ListCell *c;

	if( !root->parse->jointree )
		return false;

	fxpr = ( FromExpr*) root->parse->jointree;
	foreach( c, fxpr->fromlist )
	{
		JoinExpr *jxpr = lfirst( c );

		List *l = (List * )jxpr->quals;

		if( l )
		{
			ListCell *jc;
			foreach( jc, l )
			{
				OpExpr * oxpr = ( OpExpr * )lfirst( jc );
				const char* opname = sp_get_opname( oxpr->opno );

				if(  !opname || strcmp( opname, "=" ) )
				{
				   //continue; 
				}

				if( oxpr->args && oxpr->args->length > 0 )
				{
					ListCell *vc;
					foreach( vc, oxpr->args )
					{
						Expr *x = ( Expr * ) lfirst( vc );

						if( IsA( x, Var ) )
						{
							Var *v = (Var*)x;
							RelOptInfo *tbr = find_base_rel( root, v->varno );
							if( tbr == baserel )
							{
								const char* name = sp_get_attname( foreigntableid, v->varattno ) ;
								if( name )
								{
									if( strcmp( n, name ) == 0 )
										return true;
									free( (void*)name );
								}
								return false;

							}
						}
					}
				}

				if( opname )
					free( (void* ) opname );
			}
		}
	}
	return false;
}

void 
sj_jns( 
		PlannerInfo *root,
		RelOptInfo *baserel,
		Oid foreigntableid)
{
	SonarPlanState *fdw_private = baserel->fdw_private;

	if( so_connect_extern( fdw_private ) == 0 )
	{

		char db_node[ 64 ] = {0};
		char interest[ 64 ] = {0};
		int rc = false;
		bson_t q;
		bson_t f;
		bson_iter_t it;
		const bson_t *r;

		sprintf( db_node, "%s.system.indexes", fdw_private->uri->db_name );
		sprintf( interest, "%s.%s", fdw_private->uri->db_name, fdw_private->uri->collection_name );

		bson_init( &q );
		ASSERT_BSON_OK( rc );

		rc = BSON_APPEND_UTF8( &q, "ns", interest );
		ASSERT_BSON_OK( rc );

		ASSERT_BSON_OK( rc );

		bson_init( &f );
		ASSERT_BSON_OK( rc );

		rc = BSON_APPEND_INT32( &f, "key", 1 );
		ASSERT_BSON_OK( rc );

		ASSERT_BSON_OK( rc );


		sm_query_db( fdw_private->uri, fdw_private->uri->db_name, "system.indexes", 0, 0, &q, &f );


		while( mongoc_cursor_next( fdw_private->uri->cursor, &r ) )
		{
			const char *key;

			if( bson_iter_init_find( &it, r, "key") )
			{
				const bson_value_t * v;
				bson_type_t t;

				SU_BSON_VAL( &it );
				SU_VAL_TYPE( v );

				if( t == BSON_TYPE_DOCUMENT )
				{
					const uint8_t *docbuf = NULL;
					uint32_t doclen = 0;
					bson_t bs;

					bson_iter_document (&it, &doclen, &docbuf);

					if ( bson_init_static (&bs, docbuf, doclen) )
					{
						bson_iter_t its;

						bson_iter_init( &its, &bs );

						if( bson_iter_next( &its ) )
						{

							key = bson_iter_key( &its );

							if( sj_join_field( root, baserel,  foreigntableid, key ) )
							{
								int i = bson_iter_int32( &its );
								if( i != 0 )
								{
									JoinAttr ja = ( JoinAttr  )malloc( sizeof( *ja ) );
									memset( ja, 0, sizeof( *ja ) );
									sf_strdup( key, (char**)&ja->name );
									ja->index = bson_iter_int32( &its );
									fdw_private->jns = sl_lappend( fdw_private->jns, ja );
								}
							}
						}

						bson_destroy( &bs );
					}

				}
			}
		}
		
		if( fdw_private->uri->cursor )
		{
			mongoc_cursor_destroy( fdw_private->uri->cursor );
			fdw_private->uri->cursor = 0;
		}
		
	}
}

void 
sj_jns2( 
		PlannerInfo *root,
		RelOptInfo *baserel,
		Oid foreigntableid)
{
	FromExpr * fxpr ;
	ListCell *c;

	SonarPlanState *fdw_private = baserel->fdw_private;

	if( !root->parse->jointree )
		return ;

	fxpr = ( FromExpr*) root->parse->jointree;
	foreach( c, fxpr->fromlist )
	{
		Expr *expr = lfirst( c );

        if( IsA( expr, JoinExpr ) )
        {
            JoinExpr *jxpr =(JoinExpr*) expr; 
            List *l = (List * )jxpr->quals;

            if( l )
            {
                ListCell *jc;
                foreach( jc, l )
                {
                    OpExpr * oxpr = ( OpExpr * )lfirst( jc );
                    const char* opname = sp_get_opname( oxpr->opno );

                    if(  !opname || strcmp( opname, "=" ) )
                    {
                       //continue; 
                    }

                    if( oxpr->args && oxpr->args->length > 0 )
                    {
                        ListCell *vc;
                        foreach( vc, oxpr->args )
                        {
                            Expr *x = ( Expr * ) lfirst( vc );

                            if( IsA( x, Var ) )
                            {
                                Var *v = (Var*)x;
                                RelOptInfo *tbr = find_base_rel( root, v->varno );
                                if( tbr == baserel )
                                {
                                    const char* name = sp_get_attname( foreigntableid, v->varattno ) ;
                                    if( name )
                                    {
                                        JoinAttr ja = ( JoinAttr  )malloc( sizeof( *ja ) );
                                        memset( ja, 0, sizeof( *ja ) );
                                        ja->name = name; 
                                        ja->index = v->varattno; 
                                        fdw_private->jns = sl_lappend( fdw_private->jns, ja );
                                    }
                                }
                            }
                        }
                    }

                    if( opname )
                        free( (void* ) opname );
                }
            }
        }
        else if( IsA( expr, RangeTblRef ) )
        {
        }

	}
}

bool
sj_is_join( PlannerInfo * root )
{
	ListCell *from;
	FromExpr *fxr = ( FromExpr*) root->parse->jointree;
	
	if( fxr->fromlist )
	{
		foreach( from, (List*) fxr->fromlist )
		{
			Expr *expr = lfirst( from );
			if( IsA( expr, JoinExpr ) )
			{
				JoinExpr *je = (JoinExpr*) expr;

				List * quals = (List*)je->quals;

				if( IsA( quals, List ) && quals->length == 1 )
				{
					OpExpr *opexpr = lfirst( quals->head );
					
					if( IsA( opexpr, OpExpr ) && opexpr->args )
					{
						List *args = opexpr->args;

						if( args->length == 2  && root->simple_rel_array_size > 2 )
						{
							Var *vl = lfirst( args->head );
							Var *vr = lfirst( args->head->next );

						   if( IsA( vl, Var ) && IsA( vr, Var ) )
						   {
							   RelOptInfo *rell = root->simple_rel_array[ vl->varno ];
							   RelOptInfo *relr = root->simple_rel_array[ vr->varno ];

							   if( rell->fdw_private == 0 || relr->fdw_private == 0 )
								   return true;
						   }
						   if( IsA( vl, Var ) && IsA( vr, RelabelType) )
						   {
							   RelabelType *rlt = (RelabelType*)vr;
							   Expr *expr = rlt->arg;
							   if( IsA( expr, Var ) )
							   {
								   Var *v = (Var*) expr;
								   if( vl->varno != v->varno && root->query_level < 2 )
									   return true;
							   }
						   }
						}
					}
				}

// if there is one baserel is local table, tye treate as join, the usbquery will get rawl process
				if( je->jointype != JOIN_SEMI && je->jointype != JOIN_ANTI )
				{
					return true;
				}
				else
				{

				}
			}
		}

		if( fxr->fromlist->length == 2 )
		{
			RangeTblRef *rtr1 = ( RangeTblRef*) fxr->fromlist->head->data.ptr_value;
			RangeTblRef *rtr2 = ( RangeTblRef*) fxr->fromlist->head->next->data.ptr_value;

			if( IsA( rtr1, RangeTblRef )  && IsA( rtr2, RangeTblRef ) )
			{
				if( rtr1->rtindex != rtr2->rtindex && root->query_level < 2 )
					return true;
			}
		}
	}

	if( fxr->quals )
	{
		ListCell *qual;
		List *quals = (List*)fxr->quals;

		foreach( qual, quals )
		{
			Expr *x = ( Expr*) lfirst( qual );

			if( IsA( x, OpExpr ) )
			{
				OpExpr *oxpr = (OpExpr *) x;

				List *args = oxpr->args;

				if( args->length == 2 )
				{

					Var *vl = lfirst( args->head );
					Var *vr = lfirst( args->head->next );
					if( IsA( vl, Var ) && IsA( vr, Var ) )
					{
						if( vl->varno != vr->varno )
							return true;
					}
				}

			}
		}
	}

	return false;

}

bool
sj_is_loop( PlannerInfo * root )
{
	ListCell *from;
	FromExpr *fxr = ( FromExpr*) root->parse->jointree;
	
	if( fxr->fromlist )
	{
		foreach( from, (List*) fxr->fromlist )
		{
			Expr *expr = lfirst( from );
			if( IsA( expr, JoinExpr ) )
			{
				JoinExpr *je = (JoinExpr*) expr;

				List * quals = (List*)je->quals;

				if( IsA( quals, List ) && quals->length == 1 )
				{
					OpExpr *opexpr = lfirst( quals->head );
					
					if( IsA( opexpr, OpExpr ) && opexpr->args )
					{
						List *args = opexpr->args;

						if( args->length == 2  && root->simple_rel_array_size > 2 )
						{
							Var *vl = lfirst( args->head );
							Var *vr = lfirst( args->head->next );

						   if( IsA( vl, Var ) && IsA( vr, Var ) )
						   {
							   RelOptInfo *rell = root->simple_rel_array[ vl->varno ];
							   RelOptInfo *relr = root->simple_rel_array[ vr->varno ];

							   if( rell->fdw_private == 0 || relr->fdw_private == 0 )
								   return true;
						   }
						   if( IsA( vl, Var ) && IsA( vr, RelabelType) )
						   {
							   RelabelType *rlt = (RelabelType*)vr;
							   Expr *expr = rlt->arg;
							   if( IsA( expr, Var ) )
							   {
								   Var *v = (Var*) expr;
								   if( vl->varno != v->varno && root->query_level < 2 )
									   return true;
							   }
						   }
						}
					}
				}
			}
		}

	}

	if( fxr->quals )
	{
		ListCell *qual;
		List *quals = (List*)fxr->quals;

		foreach( qual, quals )
		{
			Expr *x = ( Expr*) lfirst( qual );

			if( IsA( x, OpExpr ) )
			{
				OpExpr *oxpr = (OpExpr *) x;

				List *args = oxpr->args;

				if( args->length == 2 )
				{

					Var *vl = lfirst( args->head );
					Var *vr = lfirst( args->head->next );
					if( IsA( vl, Var ) && IsA( vr, Var ) )
					{
						if( vl->varno != vr->varno )
							return true;
					}
				}

			}
		}
	}

	return false;

}

psc_private sj_join_private( psc_private priv, Index ji )
{
	PlannerInfo *root = priv->root;
	ListCell *c;

	if( root->join_search_private )
	{
		foreach( c, (List *)root->join_search_private )
		{
			psc_private p = lfirst( c );
			RelOptInfo *rel = p->baserel;

			if( rel->relid == ji )
			{
				return p;
			}
		}
	}

	return 0;
}

bool sj_on_left( JoinExpr *join_expr, RelOptInfo *baserel )
{
	FromExpr *fe = ( FromExpr*)join_expr->larg;
	List *fromlist = fe->fromlist;
	ListCell *c;

	foreach( c, fromlist )
	{
		RangeTblRef *rtr = lfirst( c );
		if( rtr->rtindex == baserel->relid )
			return true;
	}
	return false;
}

bool sj_on_left2( psc_private priv, Index *ri )
{
	PlannerInfo *root = priv->root;
	RelOptInfo *baserel = priv->baserel; 
	FromExpr *fxr = ( FromExpr*)root->parse->jointree;
	List *fromlist = fxr->fromlist;

	if( fromlist && fromlist->length == 1 )
	{
		JoinExpr *join_expr = lfirst( fromlist->head );
		if( IsA( join_expr, JoinExpr ) )
		{
			Expr *xpr  = ( Expr*)join_expr->larg;

			if( IsA( xpr, RangeTblRef ) )
			{
				RangeTblRef *rtr = (RangeTblRef *)xpr;
				if( rtr->rtindex == baserel->relid )
				{
					RangeTblRef *rrtr = ( RangeTblRef *)join_expr->rarg;
					if( IsA( rrtr, RangeTblRef ) )
					{
						priv->jpos |= 1;
						*ri = rrtr->rtindex;
						return true;
					}
				}
			}
			else if( IsA( xpr, JoinExpr ) )
			{
			}
		}
	}
	return false;
}

bool sj_sonar_join( PlannerInfo *root,
					RelOptInfo *baserel,
					psc_private priv)
{
	bool rc = false;

	if( sj_is_join( root ) )
	{
        if( su_sonardb( root, baserel, priv ) )
        {
           priv->t = query_sonar_join;
           rc = true;
        }
    }

	return rc;
}

bson_t * sj_join_query( psc_private priv, Index idx )
{
	if( !priv->g )
	{
		PlannerInfo *root = priv->root;
		RelOptInfo *baserel = priv->baserel; 
		FromExpr *fxr = ( FromExpr*)root->parse->jointree;
	   List *fromlist = fxr->fromlist;

	   psc_private joinpriv = sj_join_private( priv, idx );

		priv->g = bson_new();
		
		if( fromlist && fromlist->length == 1 )
		{
			JoinExpr *join_expr = lfirst( fromlist->head );
			List * quals = (List*) join_expr->quals;

			if( IsA( quals, List ) && quals->length == 1 )
			{
				OpExpr *opexpr = lfirst( quals->head );
				
				if( IsA( opexpr, OpExpr ) && opexpr->args )
				{
					List *args = opexpr->args;

					if( args->length == 2 )
					{
						int rc = 0;
						char join_field[ NAMEDATALEN ] = {0}; 
						Var *vl = lfirst( args->head );
						Var *vr = lfirst( args->head->next );

					   if( IsA( vl, Var ) && IsA( vr, Var ) )
					   {
						   if( vl->varno != baserel->relid )
						   {
								vr = lfirst( args->head );
								vl = lfirst( args->head->next );
							  
						   }
					   }

					   sprintf( join_field, "@%s@%s", joinpriv->uri->collection_name, priv->nm[ vl->varattno -1 ].sn );

					   sf_strdup( join_field, (char**)&priv->js );

					   sprintf( join_field, "$%s.$%s", joinpriv->uri->collection_name, joinpriv->nm[ vr->varattno -1 ].sn );

					   rc = BSON_APPEND_UTF8( priv->g,  priv->nm[ vl->varattno - 1 ].sn , join_field );
					   ASSERT_BSON_OK( rc );
					}
				}
			}
		}
	}

	return priv->g;
}

bson_t * sj_fields( psc_private priv, Index idx )
{
	bool rc = false;
#if 0

	RelOptInfo *rel = priv->baserel;
	psc_private jp = sj_join_private( priv, idx );
	RelOptInfo *jrel = jp->baserel;
    bson_t *b = 0;
	
	if( !b )
	{
		b =  bson_new();
		if(  priv->L )
		{
			ListCell *c;

			foreach( c, priv->L )
			{
				TargetEntry *e = ( TargetEntry*)lfirst( c );

				if( IsA( e->expr, Var ) )
				{
					Var *v =  ( Var* ) e->expr;
					if( v->varno == rel->relid )
					{
						rc = BSON_APPEND_INT32( b, priv->nm[ v->varattno -1 ].sn, 1 );
						ASSERT_BSON_OK( rc );
					}
					else if( v->varno == jrel->relid )
					{
						char joined_field[ NAMEDATALEN ] = {0}; 
					   sprintf( joined_field, "%s.%s", (char*) priv->js, jp->nm[ v->varattno -1 ].sn );
						rc = BSON_APPEND_INT32( b, joined_field, 1 );
						ASSERT_BSON_OK( rc );
					}
				}
			}
		}
	}

	return b;
#endif
    return 0;
}

bool sj_plan_rtr_rtr( psc_private priv, JoinExpr *jx, bson_t *pipe , array_unit *au)
{
	int rc =0;
	PlannerInfo *root = priv->root;
   
	RangeTblRef *larg = (RangeTblRef*) jx->larg;
	RangeTblRef *rarg = (RangeTblRef*) jx->rarg;
	RangeTblRef * jxquals = (RangeTblRef*) jx->quals;
	List * quals = (List *)jxquals;
	ListCell *c;


    const char *idx = 0;
    //array_unit au_proj = { 0 };
	bson_t jnn;
	bson_t jn;
	bson_t jm;
	//bson_t jp;
	bson_t jpm;
		 
	psc_private lpriv = 0;
	psc_private rpriv = 0;

	if( !su_find_private( root, larg->rtindex, &lpriv) || !su_find_private( root, rarg->rtindex, &rpriv ) )
		return;

	lpriv->jpos |= 1;
	rpriv->jpos |= 2;

    if( priv->jpos & 2 )
        return false;

    idx = array_index( au );
    rc = BSON_APPEND_DOCUMENT_BEGIN( pipe, idx, &jnn ); 

	rc = BSON_APPEND_DOCUMENT_BEGIN( &jnn, "$join", &jn );
	ASSERT_BSON_OK( rc );

	rc = BSON_APPEND_UTF8( &jn,  "$joined", rpriv->uri->collection_name );
	ASSERT_BSON_OK( rc );

	rc = BSON_APPEND_UTF8( &jn,  "$as", rpriv->uri->collection_name );
	ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_INT32( &jn,  "$multi", 3 );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_DOCUMENT_BEGIN( &jn, "$match", &jm );

	if( rc )
	{
		foreach( c, quals )
		{
			Expr *expr = lfirst( c );
			
			if( IsA( expr, OpExpr ) )
			{
				OpExpr* opexpr = (OpExpr*) expr;
				List *args = opexpr->args;

				if( !args )
					continue;

				if( args->length == 2 )
				{
					char join_field[ NAMEDATALEN ] = {0}; 

					Var *vl = lfirst( args->head );
					Var *vr = lfirst( args->head->next );

					if( IsA( vl, Var ) && IsA( vr, Var ) )
					{
					}

                    //XXX joined field 
					sprintf( join_field, "$%s.$%s", rpriv->uri->collection_name, rpriv->nm[ vr->varattno -1 ].sn );
					sf_strdup( join_field, (char**)&priv->js );

					rc = BSON_APPEND_UTF8( &jm,  lpriv->nm[ vr->varattno - 1 ].sn , join_field );
					ASSERT_BSON_OK( rc );
				}
			}
		}
    }

    bson_append_document_end( &jn, &jm );


	rc = BSON_APPEND_ARRAY_BEGIN( &jn, "$project", &jpm );

	if( rc )
	{
		ListCell *c;
        array_unit au1 = { 0 };
        const char* idx = 0; 

		foreach( c, rpriv->L )
		{
			TargetEntry *e = ( TargetEntry*)lfirst( c );
			Expr *expr = e->expr;
			if( IsA( expr, Var ) )
			{
				Var *v =(Var*)expr; 
				if( v->varno == rarg->rtindex )
                {
                    idx = array_index( &au1 );
					rc = BSON_APPEND_UTF8( &jpm, idx, rpriv->nm[ v->varattno -1 ].sn);
                }
			}
		}
	}
    bson_append_array_end( &jn, &jpm );
    bson_append_document_end( &jnn, &jn );
    bson_append_document_end( pipe, &jnn );
    return true;
}


bool sj_plan_jxpr_rtr( psc_private priv, JoinExpr *jx , bson_t *pipe , array_unit *au)
{
	//PlannerInfo *root = priv->root;
	RelOptInfo* baserel = priv->baserel;
	Node *larg = jx->larg;
	Node *rarg = jx->rarg;
	Node * quals = jx->quals;
	bson_t pnode;

	if( IsA( larg, RangeTblRef ) && IsA(rarg, RangeTblRef ) )
	{
		if( IsA( quals, List ) )
		{
            return sj_plan_rtr_rtr( priv, jx, pipe, au );
		}
	}
	else if( IsA( larg, JoinExpr) && IsA(rarg, RangeTblRef) ) 
	{
		if( IsA( quals, List ) && ((List*)quals)->length == 1 )
		{
			JoinExpr *jxpr = (JoinExpr *) larg;
			RangeTblRef *rrtr = (RangeTblRef*)rarg;

			if( rrtr->rtindex == baserel->relid )
            {
				priv->jpos |= 2;
                return false;
            }

            if( sj_plan_jxpr_rtr( priv, jxpr, pipe, au ) )
            {
                bson_init( &pnode );
                su_push_doc_in_array( pipe, au, &pnode ); 
                bson_destroy( &pnode );
                return true;
            }
            else
                return false;
		}
	}
	else  // Are there JoinExpr join JoinExpr, document seems say no
	{
        sl_log( INFO, "Warning:", "sj_plan_scan unprocessed JoinExpr \n" );
	}

    return true;
}
