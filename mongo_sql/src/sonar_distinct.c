#include "sonar_utils.h"

#include "sonar_log.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_query.h"
#include "sonar_subquery.h"
#include "sonar_distinct.h"


extern TargetEntry* get_sortgroupref_tle(
	Index  	sortref,
	List *  	targetList );


int sd_plan_scan( psc_private  priv, Var* v, Datum d )
{
	int rc = false;
    array_unit au = {0};
	TargetEntry *tle = 0;
	ListCell *l;

    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;

    bson_t sbp;
    bson_t sb;

    if( !priv->g )
    {
        priv->g = bson_new();

        rc = bson_append_array_begin( priv->g, "pipeline", -1, &sbp );
        ASSERT_BSON_OK( rc );


        if( ! bson_empty0( priv->q ) )
        {
            su_push_docval_in_array( &sbp, &au, "$match", priv->q );
        }

        if( !bson_empty0( priv->f ) )
        {
            su_push_docval_in_array( &sbp, &au, "$project", priv->f );
        }

        if( v )
        {
            bson_init( &sb );

            rc = sb_append_eq2( &sb, priv->nm[ v->varattno-1].sn,  v->vartype, d );
            ASSERT_BSON_OK( rc );
            su_push_docval_in_array( &sbp, &au, "$match", &sb );
            bson_destroy( &sb );
        }

        bson_init( &sb );  //group

        if( root->parse->distinctClause) 
        {
            bson_t id; 
            rc = BSON_APPEND_DOCUMENT_BEGIN( &sb, "_id", &id );
            ASSERT_BSON_OK( rc );

            foreach(l, root->parse->distinctClause) {
                SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

                tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);
                if(tle ) // find one distinct col
                {
                    Expr * expr = tle->expr;
                    char fs[NAMEDATALEN] = {0};
                    char s[NAMEDATALEN] = {0};


                    if( IsA( expr, Var ) )
                    {
                        Var *v = (Var*)expr;

                        sprintf( fs, "pscol%d", v->varattno );

                        rc = BSON_APPEND_UTF8( &id, fs, sonar_prepend( s, priv->nm[ v->varattno - 1].sn,"$"));
                        ASSERT_BSON_OK( rc );

                    }
                    else if( IsA( expr, RowExpr ) )
                    {
                        RowExpr *rowexpr = (RowExpr*) expr;
                        ListCell *c;
                        foreach( c, rowexpr->args )
                        {
                            Var *v = (Var*)lfirst( c );

                            sprintf( fs, "pscol%d", v->varattno );
                            rc = BSON_APPEND_UTF8( &id, fs, sonar_prepend( s, priv->nm[ v->varattno - 1].sn,"$"));
                        }

                    }
                    else if( IsA( expr, FuncExpr ) )
                    {
                        FuncExpr *fx = (FuncExpr*) expr;

                        const char* fname = get_func_name( fx->funcid );

                        if(! strcmp( fname , "unnest" ) )
                        {
                            if( fx->args->length == 1 )
                            {
                                Var *v = lfirst( fx->args->head );
                                if( IsA( v, Var ) )
                                {
                                    sprintf( fs, "pscol%d", v->varattno );
                                    rc = BSON_APPEND_UTF8( &id, fs, sonar_prepend( s, priv->nm[ v->varattno - 1].sn,"$"));
                                        
                                }
                            }
                        }
                    }
                }
            }

            bson_append_document_end( &sb, &id );

            if( baserel->reltargetlist )
            {
                ListCell *c;
                bson_t col;

                foreach( c,  priv->l )
                {
                    Var *v = ( Var *)lfirst( c );
                    
                    if( ! sonar_var_in_list( baserel->reltargetlist, v) )
                    {
                        char  col_name[NAMEDATALEN] = {0};
                        char  fn[NAMEDATALEN] = {0};

                        //sprintf( col_name, "%s", priv->nm[ v->varattno-1].sn );
                        sprintf( col_name, "pscol%d", v->varattno );
                        //su_update_name( col_name);

                        sprintf( fn, "$%s", priv->nm[ v->varattno - 1].sn );

                        rc = BSON_APPEND_DOCUMENT_BEGIN( &sb, col_name, &col );
                        ASSERT_BSON_OK( rc );

                        rc = BSON_APPEND_UTF8( &col, "$first", fn );
                        ASSERT_BSON_OK( rc );

                        bson_append_document_end( &sb, &col );
                    }
                }
            }
        }
        else if( ss_is_subquery( root, baserel, priv ) ) // this happens for subquery removing duplicate values
        {
            ListCell *c;

            foreach( c,  priv->l )
            {
                char s[NAMEDATALEN] = {0};
                char  col_name[NAMEDATALEN] = {0};
                char fs[NAMEDATALEN] = {0};

                bson_t col;

                Var *v = ( Var *)lfirst( c );

                //rc = BSON_APPEND_UTF8( &sb, "_id", sonar_prepend( s, priv->nm[ v->varattno-1].sn, "$" ) );
                sprintf( fs, "pscol%d", v->varattno );
                rc = BSON_APPEND_UTF8( &sb, "_id", "all" );

                sprintf( col_name, "%s", priv->nm[ v->varattno-1].sn );
                su_update_name( col_name);

                rc = BSON_APPEND_DOCUMENT_BEGIN( &sb, fs, &col );
                //rc = BSON_APPEND_DOCUMENT_BEGIN( &sb, col_name, &col );
                ASSERT_BSON_OK( rc );

                //rc = BSON_APPEND_UTF8( &col, "$first",  sonar_prepend( s, priv->nm[ v->varattno-1].sn, "$" ));
                rc = BSON_APPEND_UTF8( &col, "$first",  sonar_prepend( s, priv->nm[ v->varattno-1].sn, "$" ));
                ASSERT_BSON_OK( rc );

                bson_append_document_end( &sb, &col );
                break;
            }

        }

        su_push_docval_in_array( &sbp, &au, "$group", &sb );

        bson_destroy( &sb );
    
        if( priv->o )
        {
            su_push_doc_in_array( &sbp, &au, priv->o );
        }

        if( priv->tuple_offset > 0 )
        {
            bson_init( &sb );
            rc = BSON_APPEND_INT32( &sb, "$skip", priv->tuple_offset );

            su_push_doc_in_array( &sbp, &au, &sb );
            bson_destroy( &sb );
        }


        if( priv->tuple_limit != 0 && priv->tuple_limit != -1 )
        {
            bson_init( &sb );
            BSON_APPEND_INT32( &sb, "$limit", priv->tuple_limit );
            su_push_doc_in_array( &sbp, &au, &sb );
            bson_destroy( &sb );
        }

        rc = bson_append_array_end( priv->g, &sbp ); // pipeline
        ASSERT_BSON_OK( rc );

    }
    return rc;
}

TupleTableSlot *
sd_iterate(ForeignScanState *node )
{
    struct sigaction old;
	TupleTableSlot *slot = node->ss.ss_ScanTupleSlot;
	ForeignScan *scanstate = (ForeignScan *) node->ss.ps.plan;
	psc_private priv = lfirst( scanstate->fdw_private->head ); 

    const bson_t *r;
    //const bson_t e;
    bson_error_t error;

	ListCell *c = NULL;
	int fi = 0;

	memset( slot->tts_values, 0, slot->tts_tupleDescriptor->natts * sizeof(Datum));
	memset( slot->tts_isnull, true, slot->tts_tupleDescriptor->natts * sizeof(bool));

	ExecClearTuple(slot);
    sp_suspend_signal( SIGALRM, &old ); 

	if( mongoc_cursor_next( priv->uri->cursor, &r) )
	{
		foreach( c, priv->l )
		{
			Var * v = ( Var * )lfirst( c );

			if( IsA( v, Var ) )
			{
				const char * pgn;
                char fs[NAMEDATALEN] = {0};
                char fsid[NAMEDATALEN] = {0};
				int ci;

                //XXX this way, we can search dotname values
                sprintf( fs, "pscol%d", v->varattno );
                sprintf( fsid, "_id.pscol%d", v->varattno );

                //XXX work around postgres bug
				if( v->varattno == 0 )
					v->varattno = 1;

				pgn = priv->nm[ v->varattno -1 ].pn;
				ci = v->varattno -1 ;

				if( ci >= slot->tts_tupleDescriptor->natts )
					continue;

				slot->tts_tupleDescriptor->attrs[ci]->attrelid = priv->id; 
				memcpy( slot->tts_tupleDescriptor->attrs[ci]->attname.data, pgn, NAMEDATALEN); 
				slot->tts_tupleDescriptor->attrs[ci]->atttypid = v->vartype; 
				slot->tts_tupleDescriptor->attrs[ci]->attnum = v->varattno; 
				slot->tts_tupleDescriptor->attrs[ci]->atttypmod = v->vartypmod; 
                
                if( !( su_mongo_pg_map( r, slot, ci,  fs ) || su_mp_descend_map( r, slot, ci, fsid ) ) )
                {
                     slot->tts_isnull[ ci ] = true;
                     //sl_log( "find vallue failed\n", fn  );
                }

				fi++;
			}
		}

		slot->tts_isempty = false;
		slot->tts_shouldFree = false; 
		slot->tts_shouldFreeMin = false; 
		slot->tts_slow = false; 
		slot->tts_tuple = NULL; 
		slot->tts_nvalid = fi; 
		slot->tts_buffer = InvalidBuffer; 
		slot->tts_tupleDescriptor->constr = NULL; 
		slot->tts_tupleDescriptor->tdtypeid = RECORDOID; 
		slot->tts_tupleDescriptor->tdtypmod = -1; 
		slot->tts_tupleDescriptor->tdhasoid = true; 
		
		ExecStoreVirtualTuple(slot);

        if (mongoc_cursor_error(priv->uri->cursor, &error)) 
        {
            sl_warn( &error, priv->g );
        }
		
        priv->js = slot;
        sp_resume_signal( SIGALRM, &old ); 
		return slot;
	}
    sp_resume_signal( SIGALRM, &old ); 
	return NULL;
}

void
sd_scan( psc_private priv )
{
    if( priv->uri->cursor == 0 )
        su_aggregate( priv );
}

int sd_plan_rescan( psc_private  priv, Var* v, Datum d )
{
    if( priv->f )
        bson_destroy( priv->f );

    return sd_plan_scan( priv, v, d );
}
