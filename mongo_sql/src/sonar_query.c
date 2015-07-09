
#include "sonar_utils.h"

#include "sonar_log.h"
#include "sonar_list.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_restriction.h"
#include "sonar_outstretch.h"
#include "sonar_query.h"
#include "sonar_order.h"

//#include "xxx.tmp"

void
sq_scan( psc_private priv )
{
    if( priv->uri->cursor == 0 )
        su_aggregate( priv );
}


bool 
sq_explain( psc_private priv , ExplainState *es)
{ 
    const char *explain;
    bson_t sb;
    const bson_t *r;

    bson_init( &sb );
    bson_append_bool( &sb, "explain", 7, true );
    priv->uri->cursor = sm_aggregate( priv->uri->collection, priv->g, &sb );

    mongoc_cursor_next( priv->uri->cursor, &r );

    explain = bson_as_json( r, 0 );
    appendStringInfo( es->str, "\n%s query:\n%s\n", priv->uri->collection_name, explain );

    bson_free( explain );
    bson_destroy( &sb );
	return true;
}

bool 
sq_plan_scan( psc_private  priv, Var* v, Datum d )
{
    int rc = false;
    array_unit au = { 0 };

    List *l = 0;

    bson_t sbp;
    bson_t sb;
    if( !priv->g )
    {
        priv->g = bson_new();

        rc = BSON_APPEND_ARRAY_BEGIN( priv->g, "pipeline",&sbp );
        ASSERT_BSON_OK( rc );

        sq_pipeline_unwind( priv, &au, &sbp );

        if( !bson_empty0( priv->f ) )
        {
            bson_t *f = bson_copy( priv->f );
            l = sl_lappend(l, f );
        }

        if( l )
            priv->projs = sl_lappend( priv->projs, l );

        if( priv->projs )
        {

            List *ll;
            ListCell *c;

            if( priv->projs->length < 2 )
            {
                if( !bson_empty( priv->q ) )
                    su_push_docval_in_array( &sbp, &au, "$match", priv->q );
            }
                
            sq_unify_mp( priv, priv->projs, &ll );

            foreach( c, ll )
            {
                bson_t *b = lfirst( c );
                su_push_docval_in_array( &sbp, &au, "$project", b );
            }

            if( priv->projs->length >= 2 )
            {
                if( !bson_empty( priv->q ) )
                    su_push_docval_in_array( &sbp, &au, "$match", priv->q );
            }

        }

        if( !bson_empty0( priv->o ) )
        {
            su_push_doc_in_array( &sbp, &au, priv->o );
        }


        if( priv->tuple_offset > 0 )
        {
            bson_init( &sb );
            rc = BSON_APPEND_INT32(&sb, "$skip", priv->tuple_offset );
            ASSERT_BSON_OK( rc );

            su_push_doc_in_array( &sbp, &au, &sb );
            bson_destroy( &sb );
        }

        if( priv->tuple_limit && priv->tuple_limit != -1 )
        {
            bson_init( &sb );
            rc = BSON_APPEND_INT32(&sb, "$limit",  priv->tuple_limit );
            ASSERT_BSON_OK( rc );

            su_push_doc_in_array( &sbp, &au, &sb );
            bson_destroy( &sb );
        }

        rc = bson_append_array_end( priv->g,&sbp ); // pipeline
        ASSERT_BSON_OK( rc );

        return true;
    }

    return false;

}

TupleTableSlot *
sq_iterate(ForeignScanState *node )
{
    struct sigaction old;
	TupleTableSlot *slot = node->ss.ss_ScanTupleSlot;
	ForeignScan *scanstate = (ForeignScan *) node->ss.ps.plan;
	psc_private priv = lfirst( scanstate->fdw_private->head ); 

    const bson_t *r;
    const bson_t e;
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
				int ci;
				const char * snn; 

				if( v->varattno == 0 )
					v->varattno = 1;

				ci = v->varattno -1 ;

				if( ci >= slot->tts_tupleDescriptor->natts )
					continue;

				snn =  priv->nm[ ci ].sn;
				slot->tts_tupleDescriptor->attrs[ci]->attrelid = priv->id; 
				memcpy( slot->tts_tupleDescriptor->attrs[ci]->attname.data, priv->nm[ ci ].pn, NAMEDATALEN); 
				slot->tts_tupleDescriptor->attrs[ci]->atttypid = v->vartype; 
				slot->tts_tupleDescriptor->attrs[ci]->attnum = v->varattno; 
				slot->tts_tupleDescriptor->attrs[ci]->atttypmod = v->vartypmod; 

               if( ! su_mongo_pg_map( r, slot, ci,  snn ) )
               {
                   if( !su_mp_descend_map( r, slot, ci, snn ) )
                   {
                        slot->tts_isnull[ ci ] = true;
                   }
               }
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

        priv->js = slot;
        sp_resume_signal( SIGALRM, &old ); 
        return slot;
    }


    //if( (( PARTIAL_CURSOR*)priv->uri->cursor)->failed ) ;



    if (mongoc_cursor_error(priv->uri->cursor, &error)) 
    {
        sl_warn( &error, priv->g );
    }

    sp_resume_signal( SIGALRM, &old ); 
    return 0;
}



bool 
sq_plan_rescan( psc_private  priv, Var* v, Datum d )
{
        
    int rc = false;
    array_unit au = { 0 };
    bson_t sbp;
    bson_t sb;
        
    bson_reinit( priv->g );

    rc = BSON_APPEND_ARRAY_BEGIN( priv->g, "pipeline",&sbp );
    ASSERT_BSON_OK( rc );

    su_push_docval_in_array( &sbp, &au, "$project", sq_fields( priv ) );

    su_push_docval_in_array( &sbp, &au, "$match", priv->q );

    if( priv->o )
    {
        su_push_doc_in_array( &sbp, &au, priv->o );
    }


    if( priv->tuple_offset > 0 )
    {
        bson_init( &sb );
        rc = BSON_APPEND_INT32(&sb, "$skip", priv->tuple_offset );
        ASSERT_BSON_OK( rc );

        su_push_doc_in_array( &sbp, &au, &sb );
        bson_destroy( &sb );
    }

    if( priv->tuple_limit && priv->tuple_limit != -1 )
    {
        bson_init( &sb );
        rc = BSON_APPEND_INT32(&sb, "$limit",  priv->tuple_limit );
        ASSERT_BSON_OK( rc );

        su_push_doc_in_array( &sbp, &au, &sb );
        bson_destroy( &sb );
    }

    if( v )
    {
        bson_init( &sb );
        rc = sb_append_eq2( &sb, priv->nm[ v->varattno-1].sn, v->vartype, d );
        su_push_docval_in_array( &sbp, &au, "$match", &sb );
        bson_destroy( &sb );
    }

    rc = bson_append_array_end( priv->g,&sbp ); // pipeline
    ASSERT_BSON_OK( rc );

    return true;
}


bson_t * sq_fields2( psc_private priv )
{
    bool rc = false;

    List *fields = 0;
    
    if( !priv->f )
    {
        priv->f =  bson_new();
        if(  priv->l )
        {
            ListCell *c;

            foreach( c, priv->L )
            {
                TargetEntry *e = ( TargetEntry*)lfirst( c );
                char fld[ NAMEDATALEN ] = {0};
                Expr *expr = e->expr;


                su_target_json_field( priv, e, fld );

                if( !sm_target_contained( priv, priv->L, e ) )
                {
                    rc = BSON_APPEND_INT32( priv->f, fld, 1 );
                    ASSERT_BSON_OK( rc );
                }
            }
        }
    }
    return priv->f;
}

bson_t * sq_fields( psc_private priv )
{
    bool rc = false;
    
    if( !priv->f )
    {
        priv->f =  bson_new();
        if(  priv->l )
        {
            ListCell *c;

            foreach( c, priv->l )
            {
                Var *v = lfirst( c );
                if( ! sm_var_contained( priv, priv->l, v ) )
                {
                    rc = BSON_APPEND_INT32( priv->f, priv->nm[ v->varattno -1 ].sn, 1 );
                    ASSERT_BSON_OK( rc );
                }
            }
        }
    }
    return priv->f;
}

bool sq_json_field( psc_private priv, Var *v, char *fld )
{
}

bool sq_append_eq_unwind( psc_private priv, bson_t * b, Var* v,  const Const * const c )
{
    sq_append_eq_unwind2( priv, b, v, c );
}

bool sq_append_eq_unwind2( psc_private priv, bson_t * b, Var* v,  const Const * const c )
{
    bson_t elm;
    bson_t sb;

    const char *an = priv->nm[ v->varattno -1 ].ap;
    const char *fld = ((char*) priv->nm[ v->varattno -1 ].sn ) + strlen( an ) + 1;

	int rc = false;

    Oid consttype = c->consttype;
    Datum constvalue = c->constvalue;

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, an, &elm );
    ASSERT_BSON_OK(rc);

    rc = BSON_APPEND_DOCUMENT_BEGIN( &elm, "$elemMatch", &sb );
    ASSERT_BSON_OK(rc);

	switch ( consttype )
	{
		case INT2OID:
			rc = BSON_APPEND_INT32( &b, fld,  DatumGetInt16(constvalue ));
			ASSERT_BSON_OK(rc);
			break;
		case INT4OID:
			rc = BSON_APPEND_INT32( &sb, fld,  DatumGetInt32(constvalue ));
			// append int
			break;
		case INT8OID:
			rc = BSON_APPEND_INT64( &sb, fld,  DatumGetInt64(constvalue ));
		case OIDOID:
			//rc = bson_append_oid( &sb, fld, (bson_oid_t *)  DatumGetObjectId(constvalue ));
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_DOUBLE( &sb, fld, DatumGetFloat8( constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT4OID:
			rc = BSON_APPEND_DOUBLE( &sb, fld, DatumGetFloat4( constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case TEXTOID:
		{
			//rc = BSON_APPEND_UTF8( &sb, fld, DatumGetCString( constvalue ));
			rc = BSON_APPEND_UTF8( &sb, fld, text_to_cstring( DatumGetTextP( constvalue )));
			ASSERT_BSON_OK(rc);
			break;
		}
		case BOOLOID:
			rc = bson_append_bool( &sb, fld, -1, DatumGetBool( constvalue ) );
			ASSERT_BSON_OK(rc);
		break;
	}

    bson_append_document_end( &elm, &sb );
    bson_append_document_end( b, &elm );
	return rc;
}

void sq_pipeline_unwind( psc_private priv, array_unit *au, bson_t *sbp)
{
    if( priv->l )
    {
        List *unwinds = 0;
        ListCell *cell;
        foreach( cell, priv->l )
        {
            Var *v = lfirst( cell );

            if( IsA( v, Var ) )
            {
                if( priv->nm[ v->varattno -1].ap )
                {
                    bool unwinded = false;
                    if( unwinds )
                    {
                        ListCell *unwind;
                        foreach( unwind, unwinds )
                        {
                            const char *tmp = lfirst( unwind );
                            if( strcmp( tmp, priv->nm[ v->varattno -1 ].ap ) == 0 )
                            {
                                unwinded = true;
                                break;
                            }
                        }
                    }
                    if( !unwinded )
                    {
                        unwinds = sl_lappend( unwinds, priv->nm[ v->varattno -1].ap );
                        su_push_unwind_in_array( sbp, au, priv->nm[ v->varattno -1].ap );
                    }
                }
            }
        }

        if( unwinds )
        {
            sl_list_free( unwinds );
        }
    }
}

void sq_unify_mp( psc_private priv, List *lp,  List **list )
{
    int rc;
    int bllen;
    int maxlen = 0;
    int oi;
    int idx = 0;
    List ** ppl = 0;
    List *l = 0;
    ListCell *c;
    

    bllen = lp ?  lp->length : 0 ;

    ppl = ( List ** ) malloc( bllen * sizeof( List *) ); 
    memset( ppl, 0, bllen * sizeof( List* ) );

    foreach( c, lp )
    {
        ppl[idx++] = lfirst( c );
    }


    for( oi = 0; oi < bllen; oi++ )
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
            ListCell *c;
            if( !ppl[idx] )
                continue;
            if( oi >= ppl[idx]->length )
            {
                const char *key = 0;
                bson_iter_t it;
                bson_t *lb  = lfirst( ppl[idx]->tail );
                bson_iter_init( &it, lb );

                while( bson_iter_next( &it ))
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

        l = sl_lappend( l, b );

    }

    for( idx = 0; idx < bllen; idx++ )
    {
        if( ppl[idx ] )
            su_bson_list_free( ppl[ idx ] );
    }

    free( ppl );

    *list = l;
}
