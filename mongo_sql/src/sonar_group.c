
#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_nm.h"
#include "sonar_list.h"
#include "sonar_tts.h"
#include "sonar_project.h"
#include "sonar_query.h"
#include "sonar_mis.h"
#include "sonar_restriction.h"
#include "sonar_agg.h"
#include "sonar_group.h"


extern TargetEntry *
get_sortgroupref_tle(Index sortref, List *targetList);

TupleTableSlot * sg_export_tuples( void * p );

void 
sg_having_interests( psc_private priv );
                  
/** parse Query::targetList for all aggregation queries 
*/
bool 
sg_plan_scan( psc_private  priv, Var* v, Datum d )
{
	int rc = false;
    array_unit au = { 0 };
    bson_t sbp;
    bson_t sb;

    PlannerInfo *root = priv->root;

    priv->ttsdesc = sonar_create_group_ttsdesc( priv->id, priv->L ); 
    priv->fn = sg_export_tuples;

    //XXX should all having node be already listed on pirv->L
    //sg_having_interests( priv );

    if( !priv->g )
    {
        priv->g = bson_new();

        rc = BSON_APPEND_ARRAY_BEGIN( priv->g, "pipeline", &sbp );
        ASSERT_BSON_OK( rc );

        if( priv->where_map_flag == 0 )
        {
            if( !bson_empty( priv->q) )
                su_push_docval_in_array( &sbp,  &au, "$match", priv->q );
        }

        sq_pipeline_unwind( priv, &au, &sbp );

#if 0
        if( !bson_empty0( priv->f ) )
        {
            su_push_docval_in_array( &sbp, &au, "$project", priv->f );
        }
#endif

        //Create group variable
        if( root->parse->groupClause )
        {
            bson_t id;
            ListCell *l;

            bson_init( &sb );
            rc = BSON_APPEND_DOCUMENT_BEGIN( &sb, "_id", &id );
            ASSERT_BSON_OK( rc );

            foreach(l, root->parse->groupClause)
            {   
                SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

                TargetEntry* tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

                if(tle ) // find one distinct col
                {
                    char fld[ NAMEDATALEN ] = { 0 };
                    char tn[ NAMEDATALEN ] = { 0 };

                    sprintf( fld, "%s%d", "pscol", tle->resno ); 
                    if( IsA( tle->expr, FuncExpr ) )
                    {
                        FuncExpr *fxpr = (FuncExpr *)tle->expr;
                        const char * fname = get_func_name( fxpr->funcid );
                        //sprintf( tn, "$%s%d", "pscol", tle->resno ); 
                        sprintf( tn, "$%s_%x", fname, (unsigned int )(uintptr_t )fxpr->args ); 
                    }
                    else if( IsA( tle->expr, Var ) )
                    {
                        List *l = 0;
                        Var *v = (Var*)tle->expr;
                        sprintf( tn, "$%s", priv->nm[ v->varattno -1 ].sn ); 
                        sp_project_var_restrict( priv, &l, v );
                    }
                    rc = BSON_APPEND_UTF8( &id, fld , tn ); 
                }
            }   
            bson_append_document_end( &sb, &id );

            bson_destroy( &id );


            sg_create_aggregation( priv, &sb );
            //XXX there is something not filted, cauase some working stuff failure
           // sg_create_firsts( priv, &sb );
            // Create aggregation pipeline section and projection mappings
            if( priv->L )
            {

                if( priv->projs1 )
                {
                    List *list;
                    ListCell *c;
                    sg_unify_mp2( priv, priv->projs1, priv->projs, &list );

                    foreach( c, list )
                    {
                        bson_t *b = lfirst( c );
                        su_push_docval_in_array( &sbp, &au, "$project", b );
                    }
                }

                if( priv->where_map_flag == 1 )
                {
                    if( !bson_empty( priv->q) )
                        su_push_docval_in_array( &sbp,  &au, "$match", priv->q );
                }

                if( !bson_empty( &sb) )
                    su_push_docval_in_array( &sbp, &au, "$group", &sb );


            }

            bson_destroy( &sb );
        }
        //XXX clean up projs here



        if( v )
        {
            bson_t tmp;
            bson_init( &tmp );
            rc = sb_append_eq2( &tmp, priv->nm[ v->varattno-1].sn, v->vartype, d );
            ASSERT_BSON_OK( rc );
            su_push_docval_in_array( &sbp, &au, "$match",  &tmp);
            bson_destroy( &tmp );
        }

        //adding $match field for aggregation query

        if( root->parse->havingQual)
        {
            bson_t b;
            bson_init( &b );
            ASSERT_BSON_OK( rc );

            sr_expr( priv, (List *) root->parse->havingQual, &b, false, NULL, true, 0, false ); 

            su_push_docval_in_array( &sbp, &au, "$match", &b );

            bson_destroy( &b );
        }

        if( priv->projs0 )
        {
            List *list;
            ListCell *c;
            sg_unify_mp1( priv, priv->projs0, &list );

            foreach( c, list )
            {
                bson_t *b = lfirst( c );
                su_push_docval_in_array( &sbp, &au, "$project", b );
            }
        }

        if( priv->o )
        {
            su_push_doc_in_array( &sbp, &au, priv->o );
        }


        if( priv->tuple_offset > 0 )
        {
            bson_t tmp;
            bson_init( &tmp );
            rc = BSON_APPEND_INT32( &tmp, "$skip", priv->tuple_offset );
            ASSERT_BSON_OK( rc );

            su_push_doc_in_array( &sbp, &au, &tmp);

            bson_destroy( &tmp );

        }

        if( priv->tuple_limit && priv->tuple_limit != -1 )
        {
            bson_t tmp;
            bson_init( &tmp );
            rc = BSON_APPEND_INT32( &tmp, "$limit",  priv->tuple_limit );
            ASSERT_BSON_OK( rc );

            su_push_doc_in_array( &sbp, &au, &tmp );
            bson_destroy( &tmp );
        }

        bson_append_array_end( priv->g, &sbp ); // pipeline
        ASSERT_BSON_OK( rc );
    }

	return rc;
}

void
sg_scan( psc_private priv )
{
    if( priv->uri->cursor == 0 )
        su_aggregate( priv );
}


TupleTableSlot *
sg_iterate(ForeignScanState *node )
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
sg_export_tuples( void * p )
{
    struct sigaction old;
    psc_private  priv = (psc_private ) p;
    TupleTableSlot * tts = 0 ; 

    const bson_t *r;
    bson_error_t error;
	
    sp_suspend_signal( SIGALRM, &old ); 
    if( mongoc_cursor_next( priv->uri->cursor, &r ) )
    {
        ListCell *c;

        tts = MakeTupleTableSlot(); ExecSetSlotDescriptor( tts, priv->ttsdesc ); /* new tuple descriptor */
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

            if( e->resjunk )
            {
                sprintf( fn, "_id.pscol%d", e->resno );
            }
            else
            {
                sprintf( fn, "pscol%d", e->resno);
            }

            if( IsA( expr, FuncExpr ) )
            {
               
            }

           if ( !( su_mongo_pg_map( r, tts, ci,  fn ) || su_mp_descend_map( r, tts, ci, fn) ) )
            {
                 tts->tts_isnull[ ci ] = true;
                 //sl_log( "find vallue failed\n", fn  );
            }
        }

        if (mongoc_cursor_error(priv->uri->cursor, &error)) 
        {
            sl_warn( &error, priv->g );
        }
    }
    else //reset the cursor
    {
        mongoc_cursor_destroy( priv->uri->cursor );
        priv->uri->cursor = 0;
        sg_scan( priv );
    }

    priv->js = tts;
    sp_resume_signal( SIGALRM, &old ); 
    return tts;
}

void 
sg_having_interests( psc_private priv )
{
    PlannerInfo *root = priv->root;
    int resno =  root->parse->groupClause->length;
    if( root->hasHavingQual )
    {
        List *l = ( List* )root->parse->havingQual;
        ListCell *c;
        foreach( c, l )
        {
            ListCell *n;
            Expr *expr = lfirst( c );
            if( IsA( expr, OpExpr ) )
            {
                OpExpr *op ;
                Aggref *ag ;
                op = (OpExpr*) expr;
                ag = (Aggref*)get_arg_by_type( op->args, T_Aggref );

                if( ag && ag->args  )
                {
                    bool exist = false;

                    //TargetEntry *e = lfirst( ag->args->head );
                    foreach( n, priv->L )
                    {
                        TargetEntry *t = ( TargetEntry*)lfirst( n );
                        Expr *tx = t->expr;

                        if( IsA( tx, Aggref ) )
                        {
                            Aggref * tag = (Aggref * ) tx;

                            if( ag->aggfnoid == tag->aggfnoid && 
                                ag->aggtype == tag->aggtype &&
                                ag->inputcollid == tag->inputcollid )
                            {
                                exist = true;
                                break;
                            }
                        }

                    }

                    if( ! exist )
                    {
                        TargetEntry * n ;
                        char tn[ NAMEDATALEN ] = { 0 };
                        char * fn = get_func_name( ag->aggfnoid );
                        char *resname = malloc( strlen( tn ) + 1);
                        memset( resname, 0, strlen( tn ) + 1 );
                        sprintf(tn, "%s%d", fn, ++resno );
                        n = makeSonarNode( TargetEntry );
                        memcpy( resname, tn, strlen( tn ) );

                        n->expr = (Expr*)ag;
                        n->resno = resno;
                        n->resname = resname;
                        n->resjunk = true;
                        priv->L = sl_lappend( priv->L, n );
                        break;
                    }
                }
            }
        }
    }
}

int sg_append_field_count( psc_private priv,
					 bson_t *b,
                     const void *v,
                     bool field  )
{
    int rc;
    if( field &&  strcmp( (const char *)v, "") == 0 )
    {
        rc = BSON_APPEND_INT32( b, "$sum", 1 );
    }
    else
    {
        bson_t sb;
       
        if( BSON_APPEND_DOCUMENT_BEGIN( b, "$sum", &sb ) )
        {
            bson_t bs_cond;
            if( BSON_APPEND_ARRAY_BEGIN( &sb, "$cond", &bs_cond ) )
            {
                bson_t bs0;

                if( BSON_APPEND_DOCUMENT_BEGIN( &bs_cond, "0", &bs0 ) )
                {
                    bson_t bs_eq;
                    if( BSON_APPEND_ARRAY_BEGIN( &bs0, "$eq", &bs_eq) )
                    {
                        bson_t bs_eq0; 
                        if( BSON_APPEND_DOCUMENT_BEGIN( &bs_eq, "0", &bs_eq0 ) )
                        {
                            bson_t bs_ifnull;
                            if( BSON_APPEND_ARRAY_BEGIN( &bs_eq0, "$ifNull", &bs_ifnull ))
                            {
                                if( field )
                                {
                                    rc = BSON_APPEND_UTF8( &bs_ifnull, "0", (const char*)v );
                                    ASSERT_BSON_OK( rc );
                                }
                                else
                                {
                                    rc = BSON_APPEND_DOCUMENT( &bs_ifnull, "0", (bson_t*) v);
                                    ASSERT_BSON_OK( rc );
                                }

                                rc = BSON_APPEND_UTF8( &bs_ifnull, "1", "" );
                                ASSERT_BSON_OK( rc );
                                rc = bson_append_array_end( &bs_eq0, &bs_ifnull); // "$ifNull" );
                                ASSERT_BSON_OK( rc );
                            }
                            rc = bson_append_document_end( &bs_eq, &bs_eq0);  // "eq 0"
                            ASSERT_BSON_OK( rc );

                            rc = BSON_APPEND_UTF8( &bs_eq, "1", "" );
                            ASSERT_BSON_OK( rc );
                        }

                        rc = bson_append_array_end( &bs0, &bs_eq ); // "eq" );
                        ASSERT_BSON_OK( rc );
                    }
                    rc = bson_append_document_end( &bs_cond, &bs0 );  // "cond 0"
                    ASSERT_BSON_OK( rc );
                    rc = BSON_APPEND_INT32( &bs_cond, "1", 0  );
                    ASSERT_BSON_OK( rc );
                    rc = BSON_APPEND_INT32( &bs_cond, "2", 1  );
                    ASSERT_BSON_OK( rc );
                }
               
                rc = bson_append_array_end( &sb, &bs_cond ); // "$cond" );
                ASSERT_BSON_OK( rc );
            }

            rc = bson_append_document_end( b, &sb );  //$sum 
            ASSERT_BSON_OK( rc );
        }
    }
    return rc;
}

int sg_append_func_count( psc_private priv,
					 bson_t * b,
                     FuncExpr *fxpr )
{
    const char * funcname = get_func_name( fxpr->funcid );

    if(  strcmp( funcname, "substring" ) == 0 || strcmp( funcname, "substr" ) == 0 ) 
    {
        sg_append_substr_count( priv, b, fxpr );
    }
    else if(  strcmp( funcname, "concat" ) == 0 ) 
    {
        sg_append_concat_count( priv, b, fxpr );
    }
    else if(  strcmp( funcname, "concat_ws" ) == 0 ) 
    {
        sg_append_concat_count( priv, b, fxpr );
    }
    else if(  strcmp( funcname, "textcat" ) == 0 ) 
    {
        sg_append_concat_count( priv, b, fxpr );
    }
    else if(  strcmp( funcname, "lower" ) == 0 ) 
    {
        sg_append_lowwerupper_count( priv, b, fxpr );
    }
    else if(  strcmp( funcname, "upper" ) == 0 ) 
    {
        sg_append_lowwerupper_count( priv, b, fxpr );
    }

    return 0;
}

int sg_append_op_count(
        psc_private priv,
        bson_t * b,
        OpExpr *opxpr )
{
    const char *opfn = get_func_name( opxpr->opfuncid );
    if( strcmp( opfn, "textcat" ))
    {
        char projvar[ NAMEDATALEN ] = {0};
        sprintf( projvar, "$%s_%x", opfn, (unsigned int )(uintptr_t )opxpr->args );
        //sp_project_math_deep( priv, org, opxpr );
    }
    else
    {
        sg_append_opcat_count( priv, b, opxpr );
    }
    return 0;
}
                  

bool 
sg_plan_rescan( psc_private  priv, Var* v, Datum d )
{
    if( priv->f )
        bson_destroy( priv->f );

    return sg_plan_scan( priv, v, d );

}

//e is a substring FuncExpr TargetEntry; 
bool sg_unique_tlev( List *l, TargetEntry* e )
{
    ListCell *c;
    bool rc = true;

    Var *sv = (Var*) lfirst( ((FuncExpr*)e->expr )->args->head );

    foreach( c, l )
    {
        TargetEntry *te = ( TargetEntry*)lfirst( c );
        
        Expr *expr = te->expr;

        if( te->resno == e->resno )
            continue;
        if( expr && IsA( expr, FuncExpr ) )
        {
            FuncExpr *fxr = (FuncExpr*) expr;
            const char *fname = get_func_name( fxr->funcid );
            if( strcmp( fname, "substring" ) == 0 || strcmp( fname, "substr" ) == 0 )
            {
                Var *v = lfirst(  fxr->args->head );
                if( v->varno == sv->varno && v->varattno == sv->varattno )
                {
                    rc = false;
                }
            }
        }
        else if( expr && IsA( expr, Var ) )
        {
            Var *v = ( Var *)expr;
            if( v->varno == sv->varno && v->varattno == sv->varattno )
            {
                rc = false;
            }
        }
    }

    return rc;

}

bool sg_func_has( FuncExpr *f, TargetEntry *e )
{
    Expr *expr = e->expr;
    Expr *args = ( Expr*)f->args;

    if( IsA( expr, FuncExpr ) )
    {
        FuncExpr *fxpr = (FuncExpr*)expr;
        if( fxpr->funcid == f->funcid && fxpr->args == f->args )
        {
            return true;
        }
        else if( args && IsA( args, List ) )
        {
            Expr *expr = lfirst( ( ( List*)args)->head );
            if( IsA( expr, Var ) )
             {
                 if( sg_var_has( (Var*)expr, e ) )
                     return true;
             }
        }

    }
    return false;

}

bool sg_var_has( Var *v, TargetEntry *e )
{
    Expr *expr = e->expr;
    if( IsA( expr, FuncExpr) )
    {
        FuncExpr* f = ( FuncExpr * )expr;
        Expr *args = ( Expr*)f->args;

        if( args && IsA( args, List ) )
        {
            Expr *expr = lfirst( ( ( List*)args)->head );
            if( IsA( expr, Var ) )
             {
                 Var *var = (Var*) expr;

                 if( v->varno == var->varno && v->varattno == var->varattno )
                     return true;
             }
        }
    }
    return false;
}

//e is a substring FuncExpr TargetEntry; 
bool sg_te_contained( List *l, TargetEntry* e )
{
    ListCell *c;

    foreach( c, l )
    {
        TargetEntry *te = ( TargetEntry*)lfirst( c );
        
        Expr *expr = te->expr;

        if( te->resno == e->resno )
            continue;
        if( expr && IsA( expr, FuncExpr ) )
        {
            FuncExpr *fxr = (FuncExpr*) expr;

            if( sg_func_has( fxr, e ) )
                return true; 
        }
        else if( expr && IsA( expr, Var ) )
        {
            Var *v = ( Var *)expr;
            if( sg_var_has( v, e ) )
                return true;
        }
    }

    return false;

}

/** to make things simple, we only process Aggref arg is Var or Explicit cast
*/
void sg_append_aggregate( psc_private priv, TargetEntry* org,  bson_t *b, Aggref* ag )
{

    char projkey[ NAMEDATALEN ] = {0};
    char projvar[ NAMEDATALEN ] = {0};

    bson_t agb;
    int rc = 0;
    TargetEntry *ae ;
    Var * av  = 0;
    CoerceViaIO *cvi;
    FuncExpr *fxpr;
    OpExpr *opxpr;
    const char * snn ;
    const char * agg_func_name = get_func_name( ag->aggfnoid );

    sprintf( projkey, "pscol%d", org->resno );
    rc = BSON_APPEND_DOCUMENT_BEGIN( b, projkey, &agb );
    ASSERT_BSON_OK( rc );

    if( ag->args )
    {
        ae = ( TargetEntry*)lfirst( ag->args->head );

        if( IsA( ae->expr, Var ) )
        {
            List *ll = 0;
            av = (Var*)ae->expr;
            sp_project_var_restrict( priv, &ll, (Var*)ae->expr );
            sprintf( projvar, "$%s", priv->nm[ av->varattno -1 ].sn );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
            cvi = (CoerceViaIO *)ae->expr;
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
            fxpr = ( FuncExpr * ) ae->expr;
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
            opxpr = (OpExpr*)ae->expr;
        }
    }

    if( strcmp( agg_func_name, "count" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            if( ag->args )
            {
                rc = sg_append_field_count( priv, &agb, projvar, true );
                ASSERT_BSON_OK( rc );
            }
            else
            {
                rc = BSON_APPEND_INT32( &agb, "$sum", 1 );
                ASSERT_BSON_OK( rc );
            }
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
            sg_append_func_count( priv, &agb, (FuncExpr*)ae->expr );
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
            sg_append_op_count( priv, &agb, (OpExpr*)ae->expr );
        }
    }
    else if( strcmp( agg_func_name, "min" ) == 0 ) 
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$min", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    
    }
    else if( strcmp( agg_func_name, "max" ) == 0 ) 
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$max", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    }
    else if( strcmp( agg_func_name, "avg" ) == 0 ) 
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$avg", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
            sg_append_func_avg( priv, &agb, (FuncExpr*)ae->expr );
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
            sg_append_op_avg( priv, &agb, (OpExpr*)ae->expr );
        }
    }
    else if( strcmp( agg_func_name, "sum" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$sum", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    }
    else if( strcmp( agg_func_name, "bool_or" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$max", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    }
    else if( strcmp( agg_func_name, "bool_and" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$min", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    }
    else if( strcmp( agg_func_name, "every" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            rc = BSON_APPEND_UTF8( &agb, "$min", projvar );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    }
    else if( strcmp( agg_func_name, "string_agg" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            if( ag->args )
            {
                ListCell *c;
                bson_t bs_agg;


                bson_init( &bs_agg );


                foreach( c, ag->args )
                {
                    TargetEntry * te = ( TargetEntry*)lfirst( c );

                    if( IsA( te->expr, Var ) )
                    {
                        Var *v = (Var*) te->expr;
                        snn=  priv->nm[ v->varattno - 1].sn;

                        sprintf( projvar, "%c%s", '$', snn );
                        rc = BSON_APPEND_UTF8( &agb, "$push", projvar );
                        break;  //right now we only support one field and no separator
                    }
                    else if( IsA( te->expr, CoerceViaIO ) )
                    {
                        Var *v = (Var*)(( CoerceViaIO*)ae->expr )->arg;
                        snn=  priv->nm[ v->varattno - 1].sn;

                        sprintf( projvar, "%c%s", '$', snn );
                        rc = BSON_APPEND_UTF8( &agb, "$push", projvar );
                        break;  //right now we only support one field and no separator
                    }
                    else if( IsA( te->expr, Const ) )
                    {
                        Const *cst = (Const*) te->expr;
                        if( cst->consttype == TEXTOID )
                        {
                            //XXX text *t = DatumGetTextP( cst->constvalue );
                            //BSON_APPEND_UTF8( priv->f, array_index( &au ), t->vl_dat );
                        }

                    }
                }
            }
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
            if( ag->args )
            {
                ListCell *c;
                bson_t bs_agg;


                bson_init( &bs_agg );


                foreach( c, ag->args )
                {
                    TargetEntry * te = ( TargetEntry*)lfirst( c );

                    if( IsA( te->expr, Var ) )
                    {
                        Var *v = (Var*) te->expr;
                        snn=  priv->nm[ v->varattno - 1].sn;

                        sprintf( projvar, "%c%s", '$', snn );
                        rc = BSON_APPEND_UTF8( &agb, "$push", projvar );
                        break;  //right now we only support one field and no separator
                    }
                    else if( IsA( te->expr, CoerceViaIO ) )
                    {
                        Var *v = (Var*)(( CoerceViaIO*)ae->expr )->arg;
                        snn=  priv->nm[ v->varattno - 1].sn;

                        sprintf( projvar, "%c%s", '$', snn );
                        rc = BSON_APPEND_UTF8( &agb, "$push", projvar );
                        break;  //right now we only support one field and no separator
                    }
                    else if( IsA( te->expr, Const ) )
                    {
                        Const *cst = (Const*) te->expr;
                        if( cst->consttype == TEXTOID )
                        {
                            //XXX text *t = DatumGetTextP( cst->constvalue );
                            //BSON_APPEND_UTF8( priv->f, array_index( &au ), t->vl_dat );
                        }

                    }
                }
            }
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
        }
    }
    else if( strcmp( agg_func_name, "array_agg" ) == 0 )
    {
        if( IsA( ae->expr, Var ) )
        {
            av = (Var*)ae->expr;
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
            cvi = (CoerceViaIO *)ae->expr;
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
            fxpr = ( FuncExpr * ) ae->expr;
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
            opxpr = (OpExpr*)ae->expr;
        }
    }

    bson_append_document_end( b, &agb );
}

void sg_append_aggregate2( psc_private priv, TargetEntry* org,  bson_t *b, Aggref* ag )
{

    char projkey[ NAMEDATALEN ] = {0};
    char projvar[ NAMEDATALEN ] = {0};

    bson_t agb;
    int rc = 0;
    TargetEntry *ae ;
    Var * av  = 0;
    const char * snn ;
    const char * agg_func_name = get_func_name( ag->aggfnoid );

    //sprintf( projkey, "%s_%x", agg_func_name, (unsigned int )(uintptr_t )ag->args );
    sprintf( projkey, "pscol%d", org->resno );


    rc = BSON_APPEND_DOCUMENT_BEGIN( b, projkey, &agb );

    if( ag->args )
    {
        ae = ( TargetEntry*)lfirst( ag->args->head );

        if( IsA( ae->expr, Var ) )
        {
            List *ll = 0;
            av = (Var*)ae->expr;
            //to make it distinct adding it to restrict project
            //priv->projs1[ org->resno -1 ] = lappend( priv->projs1[ org->resno -1 ], b );
            sp_project_var_restrict( priv, &ll, (Var*)ae->expr );

            sprintf( projvar, "$%s", priv->nm[ av->varattno -1 ].sn );
        }
        else if( IsA( ae->expr, CoerceViaIO ) )
        {
            CoerceViaIO *cvi = (CoerceViaIO *)ae->expr;

            sprintf( projvar, "$%s_%x", "coerce", (unsigned int )(uintptr_t )cvi->arg  );

            sp_project_coerce_deep( priv, org, cvi );
        }
        else if( IsA( ae->expr, FuncExpr ) )
        {
            FuncExpr *f = ( FuncExpr * ) ae->expr;

            const char *subfn = get_func_name( f->funcid );

            sprintf( projvar, "$%s_%x", subfn, (unsigned int )(uintptr_t )f->args );
            //XXX

           //create pre-group projection for funnction
           // projvar : xxxx
           sp_project_func_deep( priv, org, f );
        }
        else if( IsA( ae->expr, OpExpr ) )
        {
            OpExpr *opxpr = (OpExpr*)ae->expr;
            const char *opfn = get_func_name( opxpr->opfuncid );
            sprintf( projvar, "$%s_%x", opfn, (unsigned int )(uintptr_t )opxpr->args );
            sp_project_math_deep( priv, org, opxpr );
        }
    }
    else
    {
        //xxx here comes the count( * )
        //sprintf( projvar, "$%s", priv->nm[ av->varattno -1 ].sn );
    }


    if( strcmp( agg_func_name, "count" ) == 0 )
    {
        if( ag->args )
        {
            rc = sg_append_field_count( priv, &agb, projvar, true );
            ASSERT_BSON_OK( rc );
        }
        else
        {
            rc = BSON_APPEND_INT32( &agb, "$sum", 1 );
            ASSERT_BSON_OK( rc );
        }
    }
    else if( strcmp( agg_func_name, "min" ) == 0 ) 
    {
    
        rc = BSON_APPEND_UTF8( &agb, "$min", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "max" ) == 0 ) 
    {
        rc = BSON_APPEND_UTF8( &agb, "$max", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "avg" ) == 0 ) 
    {
        rc = BSON_APPEND_UTF8( &agb, "$avg", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "sum" ) == 0 )
    {
        rc = BSON_APPEND_UTF8( &agb, "$sum", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "bool_or" ) == 0 )
    {
        rc = BSON_APPEND_UTF8( &agb, "$max", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "bool_and" ) == 0 )
    {
        rc = BSON_APPEND_UTF8( &agb, "$min", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "every" ) == 0 )
    {
        rc = BSON_APPEND_UTF8( &agb, "$min", projvar );
        ASSERT_BSON_OK( rc );
    }
    else if( strcmp( agg_func_name, "string_agg" ) == 0 )
    {
        if( ag->args )
        {
            ListCell *c;
            bson_t bs_agg;


            bson_init( &bs_agg );


            foreach( c, ag->args )
            {
                TargetEntry * te = ( TargetEntry*)lfirst( c );

                if( IsA( te->expr, Var ) )
                {
                    Var *v = (Var*) te->expr;
                    snn=  priv->nm[ v->varattno - 1].sn;

                    sprintf( projvar, "%c%s", '$', snn );
                    rc = BSON_APPEND_UTF8( &agb, "$push", projvar );
                    break;  //right now we only support one field and no separator
                }
                else if( IsA( te->expr, CoerceViaIO ) )
                {
                    Var *v = (Var*)(( CoerceViaIO*)ae->expr )->arg;
                    snn=  priv->nm[ v->varattno - 1].sn;

                    sprintf( projvar, "%c%s", '$', snn );
                    rc = BSON_APPEND_UTF8( &agb, "$push", projvar );
                    break;  //right now we only support one field and no separator
                }
                else if( IsA( te->expr, Const ) )
                {
                    Const *cst = (Const*) te->expr;
                    if( cst->consttype == TEXTOID )
                    {
                        //XXX text *t = DatumGetTextP( cst->constvalue );
                        //BSON_APPEND_UTF8( priv->f, array_index( &au ), t->vl_dat );
                    }

                }
            }
        }
    }

    bson_append_document_end( b, &agb );
}

void sg_append_func( psc_private priv, TargetEntry *org,  bson_t *sb, FuncExpr *fxpr )
{
    int rc = 0;
    bson_t b;
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    //create projection, if last is aggregation, create it
    sprintf( projkey, "pscol%d", org->resno );

    rc = BSON_APPEND_DOCUMENT_BEGIN( sb, projkey, &b );
    ASSERT_BSON_OK( rc );

    //XXX sprintf( projval, "$%s_%x", fname, (unsigned int )(uintptr_t )fxpr->args );
    sprintf( projval, "$%s", projkey );
    rc = BSON_APPEND_UTF8( &b, "$first", projval);
    ASSERT_BSON_OK( rc );

    bson_append_document_end( sb, &b );
}

void sg_append_aggregate_coerce( psc_private priv, TargetEntry* org,  bson_t *b, Aggref* ag, CoerceViaIO * cvi )
{
    char projkey[ NAMEDATALEN ] = {0};
    char projvar[ NAMEDATALEN ] = {0};
    bson_t *bs = bson_new();

    sprintf( projkey, "%s_%x", "coerce", (unsigned int )(uintptr_t )cvi->arg );

   if( cvi->coerceformat == COERCE_EXPLICIT_CAST )
   {
       Expr *axpr = cvi->arg;

       if( IsA( axpr, Var ) )
       {
           sprintf( projvar, "%s", priv->nm[ ( (Var*)axpr )->varattno -1 ].sn );
       }
       else if( IsA( axpr, Aggref ) )
       {
           Aggref *ag = ( Aggref * ) axpr;
           char * agg_func_name = get_func_name( ag->aggfnoid );

           sg_append_aggregate( priv, org, b,( Aggref *) axpr );
           sprintf( projvar, "%s_%x", agg_func_name, (unsigned int )(uintptr_t )ag->args );
       }
       else if( IsA( axpr, CoerceViaIO ) )
       {
           CoerceViaIO *cvi1 = (CoerceViaIO*)axpr;
           sprintf( projvar, "%s_%x", "coerce", (unsigned int )(uintptr_t )cvi1->arg );

           sg_append_aggregate_coerce( priv, org, b, ag, cvi1 );

       }

       sm_project_ab( priv, bs, projkey, projvar );
       priv->projs0[ org->resno -1 ] = sl_lappend( priv->projs0[ org->resno -1], bs );
   }
}

void sg_unify_mp1( psc_private priv, List **lpp, List **list )
{
    int rc;
    int maxlen = 0;
    int oi;
    int idx;
    List *l = 0;

    for( idx = 0; idx < priv->L->length; idx++ )
    {
        if( !lpp[ idx ] )
            continue;
        if( lpp[idx]->length > maxlen )
            maxlen = lpp[idx]->length;
    }

    for( oi = 0; oi < maxlen; oi++ )
    {
        bson_t *b = bson_new();

        for( idx = 0; idx < priv->L->length; idx++ )
        {
            if( !lpp[idx] )
                continue;
            if( oi >= lpp[idx]->length )
            {
                const char *key = 0;
                bson_iter_t it;
                bson_t *lb  = lfirst( lpp[idx]->tail );
                bson_iter_init( &it, lb );

                if( bson_iter_next( &it ))
                {
                    key = bson_iter_key( &it );
                    rc = BSON_APPEND_INT32( b, key, 1 );
                    ASSERT_BSON_OK( rc );
                }
            }
            else
            {
                bson_t *nb  = list_nth_node( lpp[idx], oi );
                bson_concat( b, nb );
            }
        }

        l = sl_lappend( l, b );

    }

    for( idx = 0; idx < priv->L->length; idx++ )
    {
        if( lpp[idx ] )
            su_bson_list_free( lpp[ idx ] );
    }

    *list = l;
}

void sg_unify_mp2( psc_private priv, List **lpp, List *lp,  List **list )
{
    int rc;
    int bllen;
    int maxlen = 0;
    int oi;
    int idx;
    List ** ppl = 0;
    List *l = 0;
    ListCell *c;
    

    bllen = priv->L->length + ( lp ?  lp->length : 0 );

    ppl = ( List ** ) malloc( bllen * sizeof( List *) ); 
    memset( ppl, 0, bllen * sizeof( List* ) );

    for( idx = 0; idx < priv->L->length; idx++ )
    {
        ppl[idx] = lpp[ idx ];
    }

    foreach( c, lp )
    {
        ppl[idx++] = lfirst( c );
    }


    for( oi = 0; oi < idx; oi++ )
    {
        if( !ppl[ oi ] )
            continue;
        if( ppl[oi]->length > maxlen )
            maxlen = ppl[oi]->length;
    }

    for( oi = 0; oi < maxlen; oi++ )
    {
        bson_t *b = bson_new();

        for( idx = 0; idx < bllen; idx++ )
        {
            if( !ppl[idx] )
                continue;
            if( oi >= ppl[idx]->length )
            {
                const char *key = 0;
                bson_iter_t it;
                bson_t *lb  = lfirst( ppl[idx]->tail );
                bson_iter_init( &it, lb );

                if( bson_iter_next( &it ))
                {
                    key = bson_iter_key( &it );
                    rc = BSON_APPEND_INT32( b, key, 1 );
                    ASSERT_BSON_OK( rc );
                }
            }
            else
            {
                bson_t *nb  = list_nth_node( ppl[idx], oi );
                bson_concat( b, nb );
            }
        }

        if( sb_all_one( b ) )
        {
            bson_destroy( b );
        }
        else
            l = sl_lappend( l, b );

    }

    for( idx = 0; idx < priv->L->length; idx++ )
    {
        if( ppl[idx ] )
            su_bson_list_free( ppl[ idx ] );
    }

    free( ppl );

    *list = l;
}


void sg_create_aggregation( psc_private priv, bson_t *sb )
{
    ListCell *c;

    foreach( c, priv->L )
    {
        TargetEntry *e = ( TargetEntry*)lfirst( c );
        char projkey[ NAMEDATALEN ] = {0};
        
        Expr *expr = e->expr;

        sprintf( projkey, "pscol%d", e->resno );

        if( IsA( expr, Var ) )
        {
            //XXX create project for thte var: "pscol'resno'" : $snn

        }
        else if( IsA ( expr, Aggref ) )
        {
            bson_t *b = bson_new();
            Aggref *ag = ( Aggref * ) expr;

            sg_append_aggregate( priv, e,  sb, (Aggref *) expr );
            BSON_APPEND_INT32( b, projkey, 1 );

            priv->projs0[e->resno -1 ] = sl_lappend( priv->projs0[e->resno -1], b );
        }
        else if( IsA ( expr, FuncExpr) )
        {
            List *ll = 0;
            FuncExpr *funcxpr = (FuncExpr *)expr;
            bson_t *b = bson_new();

            sp_project_func_restrict( priv, e,  &ll, funcxpr );
            sg_append_func( priv, e, sb, funcxpr );

            BSON_APPEND_INT32( b, projkey, 1 );

            priv->projs0[e->resno -1 ] = sl_lappend( priv->projs0[e->resno -1], b );
        }

    }

}

void sg_create_firsts( psc_private priv, bson_t *sb )
{
    int rc = 0;
    ListCell *c;

    foreach( c, priv->l )
    {
        bool targeted = false;
        ListCell *l;

        Var *v = lfirst( c );

        foreach( l, priv->L )
        {
            TargetEntry *e = ( TargetEntry*)lfirst( l );
            Expr *expr = e->expr;


            if( IsA( expr, Var ) )
            {
                Var *ev = (Var*)expr;
                if( ev->varno == v->varno && ev->varattno == v->varattno )
                {
                    targeted = true;
                    break;
                }
            }
            else if( IsA ( expr, Aggref ) )
            {
                Aggref *agg = (Aggref*)expr;
                if( agg->args )
                {
                    Var *ev = lfirst( agg->args->head );
                    if( IsA( ev, Var ) )
                    {
                        if( ev->varno == v->varno && ev->varattno == v->varattno )
                        {
                            targeted = true;
                            break;
                        }
                    }
                    else if( IsA( ev, TargetEntry ) )
                    {
                        TargetEntry* te = (TargetEntry*) ev;
                        Expr *te_expr = te->expr;
                        if( IsA( te_expr, Var )  )
                        {
                            Var *vte = (Var*) te_expr;
                            if( vte->varno == v->varno && vte->varattno == v->varattno )
                            {
                                targeted = true;
                                break;
                            }
                        }
                        else if( IsA( te_expr, FuncExpr ) )
                        {
                        }

                    }
                }
            }
        }

        if(! targeted )
        {
            bson_t vb;
            char tmp[ NAMEDATALEN ] = {0};
            char coin_alias[ NAMEDATALEN ] = {0};

            bson_init( &vb );
            sprintf( coin_alias, "%s", priv->nm[ v->varattno -1 ].sn );

            rc = BSON_APPEND_UTF8( &vb, "$first", sonar_prepend( tmp, priv->nm[ v->varattno -1 ].sn, "$" ) );

            ASSERT_BSON_OK( rc );

            rc = BSON_APPEND_DOCUMENT( sb, coin_alias, &vb );
            ASSERT_BSON_OK( rc );
            bson_destroy( &vb );
        }
    }
}

void sg_mark_group_tle( psc_private priv )
{
    ListCell *c;
    PlannerInfo *root = priv->root;

    foreach( c, priv->L )
    {
        ListCell *l;
        TargetEntry *e = ( TargetEntry*)lfirst( c );

        foreach(l, root->parse->groupClause)
        {   
            SortGroupClause*sgc = (SortGroupClause *) lfirst(l);
            TargetEntry* tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

            if( tle->resno == e->resno )
            {
                e->resjunk = true;
                break;
            }
        }
    }
}

void sg_append_substr_count( psc_private priv, bson_t *b, FuncExpr *fxpr )
{
    bson_t *bs = bson_new();

    sf_substr_bson( priv, bs, fxpr );

    sg_append_field_count( priv, b, bs, false );

    bson_destroy( bs );
}

void sg_append_opcat_count( psc_private priv, bson_t *b, OpExpr *opxpr )
{
    bson_t *bs = bson_new();

    sf_opcat_bson( priv, bs, opxpr );

    sg_append_field_count( priv, b, bs, false );

    bson_destroy( bs );
}

void sg_append_lowwerupper_count( psc_private priv, bson_t *b, FuncExpr *fxpr )
{
    bson_t *bs = bson_new();

    sf_lowerupper_bson( priv, bs, fxpr );

    sg_append_field_count( priv, b, bs, false );

    bson_destroy( bs );
}


void sg_append_concat_count( psc_private priv, bson_t *b, FuncExpr *fxpr )
{
}

int sg_append_func_avg(
        psc_private priv,
        bson_t * b,
        FuncExpr *fxpr )
{
    return 0;
}


int sg_append_op_avg(
        psc_private priv,
        bson_t * b,
        OpExpr *opxpr )
{
    char field[ NAMEDATALEN ] = {0};
    const char *op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    ListCell *c;
    List *args = opxpr->args;


    IF_MATH_OPERATOR( opid )
    {
        int rc = 0;
        array_unit au = { 0 };
        const char *idx;
        bson_t auxd;
        bson_t auxb;
        rc = BSON_APPEND_DOCUMENT_BEGIN( b, "$avg", &auxd );
        ASSERT_BSON_OK( rc );

        sf_opmath_bson( priv, &auxd, opxpr ); 
        bson_append_document_end( b, &auxd );
    }

    return 0;
}

