/* * sonar_utils.c
 *
 *  Created on: Aug 2, 2013
 *      Author: ury
 */

#include "sonar_utils.h"
#include "sonar_log.h"
#include <mongoc-cursor-private.h>
#include <mongoc-client-private.h>
#include <mongoc-host-list.h>
#include "stdlib.h"

#include "sonar_option.h"
#include "sonar_list.h"
#include "sonar_func.h"

#define pg_sonar_time_offset 946684800000000UL


Datum col_from_cstr( TupleTableSlot* tts, int i,  const char * v )
{
	Datum dval = (Datum ) 0;
	TupleDesc tupdesc = tts->tts_tupleDescriptor;

	if (!tupdesc->attrs[i]->attisdropped)
	{
		Oid atttypeid;
		Oid attinfuncid; 
		Oid attioparam;
		int32 atttypmod;
		FmgrInfo *attinfuncinfo;

		attinfuncinfo = (FmgrInfo *) malloc(sizeof(FmgrInfo));
        memset( attinfuncinfo, 0, sizeof( FmgrInfo) );

		atttypeid = tupdesc->attrs[i]->atttypid;
		getTypeInputInfo(atttypeid, &attinfuncid, &attioparam);
		fmgr_info(attinfuncid, attinfuncinfo);
		atttypmod = tupdesc->attrs[i]->atttypmod;
		
		dval = InputFunctionCall( attinfuncinfo, (char*) v, attioparam, atttypmod);
		free( attinfuncinfo );
	}
	

	return dval;
}



#define COPY_SCALAR_FIELD( fldname ) (newnode->fldname = from->fldname)
#define COPY_LOCATION_FIELD( fldname ) (newnode->fldname = from->fldname)

Var* sonar_copy_var ( const Var * from )
{
     Var *newnode = makeNode(Var);
     COPY_SCALAR_FIELD(varno);
     COPY_SCALAR_FIELD(varattno);
     COPY_SCALAR_FIELD(vartype);
     COPY_SCALAR_FIELD(vartypmod);
     COPY_SCALAR_FIELD(varcollid);
     COPY_SCALAR_FIELD(varlevelsup);
     COPY_SCALAR_FIELD(varnoold);
     COPY_SCALAR_FIELD(varoattno);
     COPY_LOCATION_FIELD(location);
     return newnode;
}

void sonar_append_targetvar( const psc_private p, const Var * v )
{
    bool b = false;
    ListCell *c;

    if( !v )
        return;

    foreach( c, p->l )
    {
        Var * e = (Var*)lfirst( c );

        if( !IsA( e, Var ) )
            continue;

        if( e->varno == v->varno && e->varattno == v->varattno )
         {
             b = !b;
             break;
         }
    }

    if( !b )
    {
        Var *nv = sp_copy_var( v );
        p->l = sl_lappend( p->l, (void*)nv );
    }
}

void su_aggregate( const psc_private priv )
{
   bson_t cursor;
   bson_init( &cursor );
   BSON_APPEND_INT32( &cursor, "maxTimeMS", sonar_get_maxtimems( priv->id )); 
   BSON_APPEND_BOOL( &cursor, "allowDiskUse", true ); 
   priv->uri->cursor = sm_aggregate( priv->uri->collection, priv->g, &cursor);
   (&priv->uri->cursor->client->cluster)->sockettimeoutms = sonar_get_wait_timeout( priv->id); 

   bson_destroy( &cursor );
}

void su_query( const psc_private priv )
{
    sm_query( priv->uri, priv->tuple_offset, priv->tuple_limit == -1 ? 0 : priv->tuple_limit, priv->g, priv->f );
}

Numeric su_int64_to_numeric 	( 	int64  	v	)
{
	 Datum d = Int64GetDatum(v);
	 return DatumGetNumeric(DirectFunctionCall1(int8_numeric, d));
}


bool
su_it_tts( bson_iter_t* it, TupleTableSlot *tts, int col )
{
    const bson_value_t * v;
    bson_type_t t;
    Oid pg_t =  tts->tts_tupleDescriptor->attrs[col]->atttypid;

    SU_BSON_VAL( it );
    SU_VAL_TYPE( v );

    switch( pg_t )
    {
        case BOOLOID:
            if( t == BSON_TYPE_BOOL )
            {
                tts->tts_values[ col ] = BoolGetDatum( SU_TYPE_VAL( bool ));
                tts->tts_isnull[ col ] = false;
            }
            break;
        case TIMESTAMPOID:
            if( t == BSON_TYPE_DATE_TIME )
            {
                float8 f = (float8)( SU_TYPE_VAL( datetime)  * 1000 - PGUNIX_TSDIFF  );
                tts->tts_values[ col ] = TimestampGetDatum( f );
                tts->tts_isnull[ col ] = false;
            }
            else if( t == BSON_TYPE_TIMESTAMP )
            {
                uint32_t  timestamp; 
                uint32_t  increment;

                bson_iter_timestamp ( it, &timestamp, &increment);

                tts->tts_values[ col ] = PointerGetDatum( &timestamp );
                tts->tts_isnull[ col ] = false;
            }
            break;
        case FLOAT8OID:
            if( t == BSON_TYPE_DOUBLE )
            {
                tts->tts_values[ col ] = Float8GetDatum( SU_TYPE_VAL( double ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_INT64 )
            {
                tts->tts_values[ col ] = Float8GetDatum( SU_TYPE_VAL( int64 ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_INT32 )
            {
                tts->tts_values[ col ] = Float8GetDatum( SU_TYPE_VAL( int32 ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_BOOL )
            {
                tts->tts_values[ col ] = Float8GetDatum( SU_TYPE_VAL( bool ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_DATE_TIME )
            {
                tts->tts_values[ col ] = Float8GetDatum( SU_TYPE_VAL( datetime ));
                tts->tts_isnull[ col ] = false;
            }
            break;
        case NUMERICOID:
            if( t == BSON_TYPE_DOUBLE )
            {
                tts->tts_values[ col ] = (Datum)sp_float8_to_numeric( (float8 ) SU_TYPE_VAL( double ) );
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_INT64 )
            {
                tts->tts_values[ col ] = (Datum) su_int64_to_numeric(  SU_TYPE_VAL( int64 ));
                tts->tts_isnull[ col ] = false;
            }
            break;
        case INT4OID:
            if( t == BSON_TYPE_INT32 )
            {
                tts->tts_values[ col ] = Int32GetDatum( SU_TYPE_VAL( int32 ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_BOOL )
            {
                tts->tts_values[ col ] = Int32GetDatum( SU_TYPE_VAL( bool ));
                tts->tts_isnull[ col ] = false;
            }
            break;
        case INT8OID:
            if( t == BSON_TYPE_INT64 )
            {
                tts->tts_values[ col ] = Int64GetDatum( SU_TYPE_VAL( int64 ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_INT32 )
            {
                tts->tts_values[ col ] = Int64GetDatum( SU_TYPE_VAL( int32 ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_BOOL )
            {
                tts->tts_values[ col ] = Int64GetDatum( SU_TYPE_VAL( bool ));
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_DATE_TIME )
            {
                tts->tts_values[ col ] = Int64GetDatum( SU_TYPE_VAL( datetime ));
                tts->tts_isnull[ col ] = false;
            }
            break;
        case TEXTOID:
            if( t == BSON_TYPE_OID )
            {
                char id[ 25 ];

                bson_oid_to_string( &SU_TYPE_VAL( oid ), id );
                tts->tts_values[col] = col_from_cstr( tts, col, id );
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_CODEWSCOPE )
            {
                uint32_t length = 0;
                //const char *code;
                const uint8_t *docbuf = NULL;
                uint32_t doclen = 0;
                bson_t b;

                bson_iter_codewscope ( it, &length, &doclen, &docbuf);

                if (bson_init_static (&b, docbuf, doclen) )
                {
                    const char *json;
                    json = bson_as_json( &b, 0 );
                    tts->tts_values[ col ] = col_from_cstr( tts, col, json );
                    tts->tts_isnull[ col ] = false;
                    bson_free(json);
                }
            }
            if( t == BSON_TYPE_UTF8 )
            {
                tts->tts_values[ col ] = col_from_cstr( tts, col, SU_TYPE_STR( utf8 ) );
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_SYMBOL )
            {
                tts->tts_values[ col ] = col_from_cstr( tts, col, SU_TYPE_TSTR( symbol ) );
                tts->tts_isnull[ col ] = false;
            }
            if( t == BSON_TYPE_CODE )
            {
                tts->tts_values[ col ] = col_from_cstr( tts, col, SU_TYPE_TSTR( code ) );
                tts->tts_isnull[ col ] = false;
            }
            break;

        case REGTYPEOID:
            break;

        case BPCHAROID:
            if( t == BSON_TYPE_OID )
            {
                char id[ 25 ] = {0};

                bson_oid_to_string( &SU_TYPE_VAL( oid ), id );
                tts->tts_values[col] = col_from_cstr( tts, col, id );
                tts->tts_isnull[ col ] = false;
            }
            break;
        case JSONOID:
            if( t == BSON_TYPE_DOCUMENT )
            {
                const uint8_t *docbuf = NULL;
                uint32_t doclen = 0;
                bson_t b;

                bson_iter_document (it, &doclen, &docbuf);

                if ( bson_init_static (&b, docbuf, doclen) )
                {
                    const char *json;
                    json = bson_as_json( &b, 0 );
                    if( json )
                    {
                        tts->tts_values[ col ] = col_from_cstr( tts, col, json );
                        tts->tts_isnull[ col ] = false;
                        bson_free(json);
                    }

                    bson_destroy( &b );
                }
            }
            else if( t == BSON_TYPE_ARRAY )
            {
                const uint8_t *docbuf = NULL;
                uint32_t doclen = 0;
                bson_t b;

                bson_iter_array(it, &doclen,  &docbuf);

                if ( bson_init_static (&b, docbuf, doclen) )
                {
                    char *json = calloc( doclen + 4096, 1 );
                    char *org = json;

                    if( sb_array_as_json2( &b, &org, pg_t ) )
                    {
                        tts->tts_values[ col ] = col_from_cstr( tts, col, json ); 
                        tts->tts_isnull[ col ] = false;
                    }
                    free( json );
                    bson_destroy( &b );
                }
            }
            else
            {
                const char *json = su_primitive_bson( t, v );
                if( json )
                {
                        tts->tts_values[ col ] = col_from_cstr( tts, col, json );
                        tts->tts_isnull[ col ] = false;
                        bson_free(json);
                }
                else
                {
                    const char * key = 0;
                    uint32_t  keylen = -1;
                    bson_t b;
                    bson_init( &b );
                    bson_append_iter( &b, key,  keylen, it );
                    json = bson_as_json( &b, 0 );
                    if( json )
                    {
                        tts->tts_values[ col ] = col_from_cstr( tts, col, json );
                        tts->tts_isnull[ col ] = false;
                        bson_free(json);
                    }
                }
            }
            break;
            
        case TEXTARRAYOID:
        if( t == BSON_TYPE_ARRAY )
        {
            const uint8_t *docbuf = NULL;
            uint32_t doclen = 0;
            bson_t b;

            bson_iter_array(it, &doclen,  &docbuf);

            if ( bson_init_static (&b, docbuf, doclen) )
            {
                char *json = malloc( doclen + 16 );
                char *org = json; 

                memset( json, 0, doclen + 16 );
                if( sb_array_as_json( &b, &json, pg_t ) )
                {

                    tts->tts_values[ col ] = col_from_cstr( tts, col, org ); 
                    tts->tts_isnull[ col ] = false;
                }
                free( org );
            }
        }
        break;
        case FLOAT8ARRAYOID: 
            if( t == BSON_TYPE_ARRAY )
            {
                const uint8_t *docbuf = NULL;
                uint32_t doclen = 0;
                bson_t b;

                bson_iter_array(it, &doclen,  &docbuf);

                if ( bson_init_static (&b, docbuf, doclen) )
                {
                    char *json = malloc( doclen );
                    char *org = json; 
                    memset( json, 0, doclen );

                    if( sb_array_as_json( &b, &json, pg_t ) )
                    {

                        tts->tts_values[ col ] = col_from_cstr( tts, col, org ); 
                        tts->tts_isnull[ col ] = false;
                    }
                    free( org );
                }
            }
            break;
        case INT4ARRAYOID:
        case OIDARRAYOID:
        case FLOAT4ARRAYOID:
        case REGTYPEARRAYOID:
        case VARCHAROID:
            if( t == BSON_TYPE_ARRAY )
            {
                const uint8_t *docbuf = NULL;
                uint32_t doclen = 0;
                bson_t b;

                bson_iter_array(it, &doclen,  &docbuf);

                if ( bson_init_static (&b, docbuf, doclen) )
                {
                    char *json = malloc( doclen );
                    char *org = json; 

                    memset( json, 0, doclen );

                    if( sb_array_as_json( &b, &json, pg_t ) )
                    {

                        tts->tts_values[ col ] = col_from_cstr( tts, col, org ); 
                        tts->tts_isnull[ col ] = false;
                    }
                    free( org );
                }
            }
            break;
            default:
                tts->tts_values[ col ] = (Datum )0; 
                tts->tts_isnull[ col ] = true;
                return false;
    }
    return true;
}


bool
su_mp_descend_map( const  bson_t* bs, TupleTableSlot *tts, int col, const char *snn )
{
    bson_iter_t  iter;
    bson_iter_t  it;

    bson_iter_init( &iter, bs );

    if( bson_iter_find_descendant( &iter, snn, &it ) )
    {
        return su_it_tts( &it, tts, col );
    }
    return false;
}

bool
su_mongo_pg_map( const  bson_t* bs, TupleTableSlot *tts, int col, const char *snn )
{
    bson_iter_t  iter;

    if( bson_iter_init_find( &iter, bs, snn ) )
    {
        return su_it_tts( &iter, tts,  col );
    }

    return false;

}

Expr *
get_arg_by_type(List *l, NodeTag t)
{
    ListCell *cell = NULL;

    foreach(cell, l)
    {
        Expr *arg = (Expr *) lfirst(cell);
        if (nodeTag(arg) == t)
        {
            return arg;
        }
    }
    return NULL;
}

/* return the alias name for the having caluse since having clause has the real field, not the alias,
 * mongo aggregation has to use the alias
 */
TargetEntry*  sonar_get_alias( List *l, void * a )
{
    ListCell *c;
    Aggref *ag = ( Aggref*) a;

    foreach( c, l )
    {
        TargetEntry *e = ( TargetEntry*)lfirst( c );
        Expr *expr = e->expr;
        if( IsA( expr, Aggref ) )
        {
            Aggref *ar = ( Aggref *) expr ;
            if( ( ag->aggfnoid != ar->aggfnoid ) ||
                ( ag->aggtype != ar->aggtype ) ||
                ( ag->aggcollid != ar->aggcollid ) ||
                ( ag->inputcollid != ar->inputcollid ) ) // ||( ar->args && ag->args && ag->args->length != ar->args->length ) )
                continue;

            //return  e->resname;
            return e;
        }
        
    }
    return 0;
}


Numeric su_float8_to_numeric( float8	v )
{
	 Datum d = Float8GetDatum(v);
	 return DatumGetNumeric(DirectFunctionCall1(float8_numeric, d));
}

void
su_push_doc_in_array( bson_t *a, array_unit * i, bson_t *d )
{
    bool rc = false;
    const char *idx;

    idx = array_index( i );

    rc = BSON_APPEND_DOCUMENT( a, idx, d );
    ASSERT_BSON_OK( rc );

}

void
su_push_docval_in_array( bson_t *a, array_unit * i, const char * n, bson_t *d )
{
    bool rc = false;
    const char *idx;
    bson_t h;

    idx = array_index( i );
    rc = BSON_APPEND_DOCUMENT_BEGIN( a, idx, &h );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_DOCUMENT(&h, n, d );
    ASSERT_BSON_OK( rc );

    bson_append_document_end( a, &h );
}

void
su_push_unwind_in_array( bson_t *a, array_unit * i, const char * fld )
{
    bool rc = false;
    const char *idx;
    char tmp[ NAMEDATALEN ] = {0};
    bson_t h;

    idx = array_index( i );
    rc = BSON_APPEND_DOCUMENT_BEGIN( a, idx, &h );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_UTF8(&h, "$unwind", sonar_prepend( tmp, fld, "$" ) );
    ASSERT_BSON_OK( rc );

    bson_append_document_end( a, &h );
}

void 
su_push_bsonval_in_array( bson_t * to, array_unit * i, const char * n, const bson_t *from )
{
    bson_iter_t  iter;
    bson_iter_t  it;

    const char *idx = array_index( i );
    const int len = strlen( idx );

    if( bson_iter_init_find( &iter, from, n ) )
    {
        bson_append_iter( to, idx, len, &iter );
    }
    else
    {
        bson_iter_init( &iter, from );
        if( bson_iter_find_descendant( &iter, n, &it ) )
        {
            bson_append_iter( to, idx, len, &it );
        }
    }
}

int
su_push_distinct_in_array(
		 bson_t * to,
		 array_unit * i,
		 const char * n,
		 const bson_t *from,
         bson_t **last )
{
    bson_iter_t  iter;
    bson_iter_t  it;
    bson_t tmp;

    const char *idx = array_index( i );
    const int len = strlen( idx );

    if( bson_iter_init_find( &iter, from, n ) )
    {
        bson_init( &tmp );
        bson_append_iter( &tmp, n, strlen( n ), &iter );
        if( *last == 0 || !bson_equal( *last, &tmp ) )
        {
            bson_append_iter( to, idx, len, &iter );
            if(!bson_empty0( *last ) )
                bson_destroy( *last );
            *last = bson_copy( &tmp );
            bson_destroy( &tmp );
            return 1;
        }
    }
    else
    {
        bson_iter_init( &iter, from );
        if( bson_iter_find_descendant( &iter, n, &it ) )
        {
            bson_init( &tmp );
            bson_append_iter( &tmp, n, strlen( n ), &iter );
            if( *last == 0 || !bson_equal( *last, &tmp ) )
            {
                bson_append_iter( to, idx, len, &it );
                if( !bson_empty0( *last ) )
                    bson_destroy( *last );
                *last = bson_copy( &tmp );
                bson_destroy( &tmp );
                return 1;
            }
        }
    }
    return 0;
}

void su_target_json_field(
		 psc_private priv,
		 TargetEntry *e,
		 char *fld )
{
    Expr *expr = e->expr;

    if( IsA( expr, Var ) )
    {
        Var *v = (Var*)expr;
        sprintf( fld, "%s", priv->nm[v->varattno -1].sn );
    }
    else if( IsA( expr, OpExpr ) )
    {
        OpExpr* opxpr = (OpExpr*) expr;
        const char* opname = get_opname( opxpr->opno );

        if( strcmp( opname, "->" ) == 0 ||
            strcmp( opname, "->>" ) == 0 ||
            strcmp( opname, "#>" ) == 0 ||
            strcmp( opname, "->" ) == 0 ||
            strcmp( opname, "#>>" ) == 0 )
        {
            List *args = opxpr->args;
            Var *v = lfirst( args->head );
            Const *c = lfirst( args->head->next );

            if( IsA( v, Var) && IsA( c, Const ) )
            {
                if( c->consttype == TEXTOID )
                sprintf( fld, "%s.%s", priv->nm[ v->varattno -1].sn, (( text * )( c->constvalue ))->vl_dat );  
            }
        }
    }
    else if( IsA( expr, FuncExpr ) )
    {
        FuncExpr *funcxpr = (FuncExpr*) expr;
        const char *funcname = get_func_name( funcxpr->funcid );
        sprintf( fld, "%s_%x", funcname, (unsigned int ) (uintptr_t )funcxpr->args );

    }
}

bool su_var_grouped( psc_private priv, Var * v, TargetEntry **pp )
{
    bool rc = false;

    PlannerInfo *root = priv->root;

    ListCell *cell;

    if( !root->parse->groupClause )
        return rc;

    foreach( cell , root->parse->groupClause )
    {
        SortGroupClause*sgc = (SortGroupClause *) lfirst(cell);
        TargetEntry* e= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);
        Expr *expr = e->expr;

        if( expr && IsA( expr, Var ) )
        {
            Var *sv = ( Var *)expr;
            if( v->varno == sv->varno && v->varattno == sv->varattno )
            {
                *pp = e;
                rc = true;
            }
        }
    }
    return rc;
}

bool su_sonardb(PlannerInfo *root,
                RelOptInfo *baserel,
                psc_private priv)
{
	bool rc = false;
	bson_t buildinfo;
	bson_error_t err;
	bson_t q;

    bson_init( &q );

    BSON_APPEND_BOOL( &q, "buildInfo", 1 );

    if( mongoc_client_command_simple( 
        priv->uri->client,
        priv->uri->db_name,
        &q,
        0,
        &buildinfo,
        &err) )
    {
        bson_iter_t  iter;

        if( bson_iter_init_find( &iter, &buildinfo, "sonardb" ) )
        {
           rc = true;
        }
    }
    else
    {
        sl_err( __func__,  &err );
    }

    bson_destroy( &q );

	return rc;
}

psc_private su_find_private(PlannerInfo *root,
                            int idx,
                            psc_private *priv)
{
	RelOptInfo *baserel =  root->simple_rel_array[ idx ];

	SonarPlanState *ps =  baserel->fdw_private;

	if( !ps )
    {
		return *priv = 0;
    }

	if( IsA( ps, SonarPlanState ) )
		*priv = ps->scan_priv;
	else if( IsA( ps, SonarPrivate ) ) 
		*priv = ps;

    return *priv;
}

const char* su_primitive_bson( bson_type_t t, bson_value_t *v )
{
    const char *rc;
    switch( t )
    {
        case BSON_TYPE_BOOL:
            {
                rc = bson_malloc0( 1 + sizeof( bool ) );
                sprintf( (char*)rc, "%d", SU_TYPE_VAL( bool ) ); 
            }
            break;
        case BSON_TYPE_DATE_TIME:
            {
                rc = bson_malloc0( 1 + sizeof( float8 ) );
                sprintf( (char*)rc, "%f", (float8)( SU_TYPE_VAL( datetime)  * 1000 - PGUNIX_TSDIFF  ) );
            }
            break;
        case BSON_TYPE_TIMESTAMP:
            {
                rc = bson_malloc0( 1 + sizeof( uint32_t ) );
                sprintf( (char*)rc, "%u", (uint32_t)( v->value.v_timestamp.timestamp) );
            }
            break;
        case BSON_TYPE_DOUBLE:
            {
                rc = bson_malloc0( 1 + sizeof( double ) );
                sprintf( (char*)rc, "%f", (double)( SU_TYPE_VAL( double ) ));
            }
            break;
        case BSON_TYPE_INT64:
            {
                rc = bson_malloc0( 1 + sizeof( int64_t ) );
                sprintf( (char*)rc, "%" PRIu64 "\n" , (int64_t )( SU_TYPE_VAL( int64 ) ));
            }
            break;
        case BSON_TYPE_INT32:
            {
                rc = bson_malloc0( 1 + sizeof( int32_t ) );
                sprintf( (char*)rc, "%" PRIu32 "\n" , (int32_t )( SU_TYPE_VAL( int32 ) ));
            }
            break;
        default:
                return 0;
    }
    return rc;
}
