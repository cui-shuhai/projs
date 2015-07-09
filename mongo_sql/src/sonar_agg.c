

#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_list.h"
#include "sonar_pg.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_query.h"
#include "sonar_agg.h"

extern double date2timestamp_no_overflow(DateADT dateVal);

static sa_result
sonar_create_sa_result( void );

static void
sonar_free_sa_result( sa_result * r );

/** aggregation count for get plan */
static void 
sonarAggsPlanCount(  psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );

/** min aggregation query part for mongo 
*/
static void 
sonarAggsPlanMin(    psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );


/** max aggregation query part for mongo 
*/
static void 
sonarAggsPlanMax(    psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );


/** sum aggregation query part for mongo 
*/
static void
sonarAggsPlanSum(    psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );

/** sum aggregation query part for mongo 
*/
static void
sonarAggsPlanBoolOR( psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );

/** sum aggregation query part for mongo 
*/
static void
sonarAggsPlanBoolAND(psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );

/** sum aggregation query part for mongo 
*/
static void
sonarAggsPlanEvery(  psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );

/** avg aggregation query part for mongo 
*/
static void 
sonarAggsPlanAvg(   psc_private priv,
                     bson_t *bs,
					 TargetEntry *e );

static void
sonarAggsPlanStringAgg(  psc_private priv,
                     bson_t *bs,
                     TargetEntry *e );

static void
sonarAggsPlanParam( psc_private priv,
                    bson_t *bs,
                    TargetEntry *e );
void 
sonarAggsPlanCount(  psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
	int rc = false;
    char bf[8] = {0};
    bson_t doc;

    sprintf(bf, "%d", e->resno );
    rc = bson_append_document_begin( bs, bf, -1, &doc );
    ASSERT_BSON_OK( rc );

    rc = bson_append_int32 ( &doc , "$sum", -1, 1 );
    ASSERT_BSON_OK( rc );

    rc = bson_append_document_end( bs, &doc );
    ASSERT_BSON_OK( rc );

    priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_COUNT, e->resno, INT8OID ));
}



/** min aggregation query part for mongo 
*/
void 
sonarAggsPlanMin(    psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
	int rc = false;
    char bf[8] = {0};
    char tn[ NAMEDATALEN ] = { 0 };
	Aggref * agg = ( Aggref *) e->expr;

    TargetEntry *ve = ( TargetEntry*) lfirst( agg->args->head );
    Var * v = (Var*) ve->expr;
    if( IsA( v, Var ) )
    {
        bson_t subdoc;

        sprintf( tn, "%c%s", '$', priv->nm[ v->varattno -1 ].sn  );
        sprintf(bf, "%d", e->resno );

        rc = bson_append_document_begin( bs, bf, -1, &subdoc );
        ASSERT_BSON_OK( rc );

        rc = bson_append_utf8(&subdoc, "$min", -1, tn, -1 );
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_end( bs, &subdoc );
        ASSERT_BSON_OK( rc );

        priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_MIN, e->resno, agg->aggtype ) );
    }
}


/** max aggregation query part for mongo 
*/
void 
sonarAggsPlanMax(   psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
	int rc = false;
    char bf[8] = {0};
    char tn[ NAMEDATALEN ] = { 0 };
	Aggref * agg = ( Aggref *) e->expr;
    TargetEntry *ve ;
    Var * v ;

    if( !agg->args )
        return;

    ve = ( TargetEntry*) lfirst( agg->args->head );
    v = (Var*) ve->expr;

    if( IsA( v, Var ) )
    {
        bson_t sb;

        sprintf( tn, "%c%s", '$', priv->nm[ v->varattno - 1].sn );
        sprintf(bf, "%d", e->resno );

        rc = bson_append_document_begin( bs, bf, -1, &sb );
        ASSERT_BSON_OK( rc );

        rc = bson_append_utf8(&sb, "$max", -1,  tn, -1);
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_end( bs, &sb );
        ASSERT_BSON_OK( rc );

        priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_MAX, e->resno, agg->aggtype ));
    }
}


/** avg aggregation query part for mongo 
*/
void 
sonarAggsPlanAvg(   psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
	int rc = false;
    char bf[8] = {0};
    char tn[ NAMEDATALEN ] = { 0 };
	Aggref * agg = ( Aggref *) e->expr;

    TargetEntry *ve = ( TargetEntry*) lfirst( agg->args->head );
    Var * v = (Var*) ve->expr;
    if( IsA( v, Var ) )
    {

        bson_t sb;
        sprintf( tn, "%c%s", '$', priv->nm[ v->varattno - 1].sn );
        sprintf(bf, "%d", e->resno );

        rc = bson_append_document_begin( bs, bf, -1, &sb );
        ASSERT_BSON_OK( rc );

        rc = bson_append_utf8( &sb, "$avg", -1, tn, -1 );
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_end( bs, &sb );
        ASSERT_BSON_OK( rc );

        priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_AVG, e->resno, agg->aggtype ));
    }
}

/** sum aggregation query part for mongo 
*/
void
sonarAggsPlanSum(   psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
	int rc = false;
    char bf[8] = {0};
    char tn[ NAMEDATALEN ] = { 0 };
	Aggref * agg = ( Aggref *) e->expr;

    TargetEntry *ve = ( TargetEntry*) lfirst( agg->args->head );
    Var * v = (Var*) ve->expr;
    if( IsA( v, Var ) )
    {
        bson_t sb;
        sprintf( tn, "%c%s", '$', priv->nm[ v->varattno - 1].sn );
        sprintf(bf, "%d", e->resno );

        rc = bson_append_document_begin( bs, bf, -1, &sb );
        ASSERT_BSON_OK( rc );

        rc = bson_append_utf8(&sb, "$sum", -1, tn, -1 );
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_end( bs, &sb );
        ASSERT_BSON_OK( rc );

        priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_SUM, e->resno, agg->aggtype ));
    }
}


/** bool_or aggregation query part for mongo 
*/
void
sonarAggsPlanBoolOR( psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{

    return sonarAggsPlanMax( priv, bs, e );
}

/** bool_and aggregation query part for mongo 
*/
void
sonarAggsPlanBoolAND(psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
    sonarAggsPlanMin( priv, bs, e );
}

/** bool_and aggregation query part for mongo 
*/
void
sonarAggsPlanEvery(  psc_private priv,
					 bson_t *bs,
					 TargetEntry *e )
{
    return sonarAggsPlanBoolAND( priv, bs, e );
}


/** sum aggregation query part for mongo 
*/
void
sonarAggsPlanStringAgg(  psc_private priv,
                         bson_t *bs,
                         TargetEntry *e )
{
	int rc = false;
    char bf[8] = {0};
    char tn[ NAMEDATALEN ] = { 0 };
	Aggref * agg = ( Aggref *) e->expr;

    TargetEntry *ve = ( TargetEntry*) lfirst( agg->args->head );
    Var * v = (Var*) ve->expr;
    if( IsA( v, Var ) )
    {

        bson_t sb;
        sprintf( tn, "%c%s", '$', priv->nm[ v->varattno - 1].sn );
        sprintf(bf, "%d", e->resno );

        rc = bson_append_document_begin( bs, bf, -1, &sb );
        ASSERT_BSON_OK( rc );

        rc = bson_append_utf8(bs, "$push", -1, tn, -1 );
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_end( bs, &sb );
        ASSERT_BSON_OK( rc );

        priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_SUM, e->resno, agg->aggtype ));
    }
}

void
sonarAggsPlanParam( psc_private priv,
                    bson_t *bs,
                    TargetEntry *e )
{
    Param *param = ( Param *)e->expr;
    if( param->paramkind == PARAM_EXEC )
    {
        priv->a = sl_lappend( priv->a, sonar_make_agg_node( SONAR_AGG_PARAM, e->resno, param->paramtype ));
    }
}

/** parse Query::targetList for all aggregation queries 
*/
bool 
sa_plan_scan( psc_private  priv, Var* v, Datum d )
{
    bool rc = false;
    array_unit au = { 0 };
    bson_t sbp;
    bson_t sbq;
    bson_t  groupi;
    bson_t  group;

    if( !priv->g )
    {
        ListCell *c;
        PlannerInfo *root = priv->root;

        priv->g = bson_new();


        rc = bson_append_array_begin( priv->g, "pipeline" , 8, &sbp);
        ASSERT_BSON_OK( rc );
        if( !bson_empty( priv->q ) )
        {

            rc = bson_append_document_begin( &sbp, array_index( &au ),  1, &sbq);
            ASSERT_BSON_OK( rc );

            rc = bson_append_document( &sbq, "$match", 6,  priv->q );
            ASSERT_BSON_OK( rc );

            bson_append_document_end( &sbp, &sbq); //"0"
        }

        if( v )
        {
            bson_t sbm;
            bson_t sbv;
            rc = bson_append_document_begin( &sbp,  array_index( &au ), 1, &sbm );
            ASSERT_BSON_OK( rc );

            rc = bson_append_document_begin( &sbm,  "$match", 6, &sbv );
            ASSERT_BSON_OK( rc );

            rc = sb_append_eq2( &sbv, priv->nm[ v->varattno-1].sn, v->vartype, d );

            bson_append_document_end( &sbm, &sbv ); //"match "
            bson_append_document_end( &sbp, &sbm ); //"match index"
        }

        rc = bson_append_document_begin( &sbp, array_index( &au ), 1, &groupi);
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_begin( &groupi, "$group", 6, &group );
        ASSERT_BSON_OK( rc );

        rc = bson_append_utf8( &group, "_id", 3, "all", 3 );
        ASSERT_BSON_OK( rc );
        

        // Query target list
        foreach( c, root->parse->targetList )
        {

            TargetEntry *e = ( TargetEntry*) lfirst( c );

            Expr *expr = e->expr;
            
            if( IsA( expr, Aggref ) )
            {
                Aggref *ag = (Aggref*) expr;
                //TargetEntry *ae = (TargetEntry*) lfirst( ag->args->head );
                //Var *v = ( Var * )ae->expr;

                char * agg_func_name = get_func_name( ag->aggfnoid );

                if( !agg_func_name )
                {
                }
                else if( strcmp( agg_func_name, "count" ) == 0 )
                {
                    sonarAggsPlanCount( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "min" ) == 0 )
                {
                    sonarAggsPlanMin( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "max" ) == 0 )
                {
                    sonarAggsPlanMax( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "avg" ) == 0 )
                {
                    sonarAggsPlanAvg( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "sum" ) == 0 )
                {
                    sonarAggsPlanSum( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "bool_or" ) == 0 )
                {
                    sonarAggsPlanBoolOR( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "bool_and" ) == 0 )
                {
                    sonarAggsPlanBoolAND(priv, &group, e );
                }
                else if( strcmp( agg_func_name, "every" ) == 0 )
                {
                    sonarAggsPlanEvery( priv, &group, e );
                }
                else if( strcmp( agg_func_name, "string_agg" ) == 0 )
                {
                    sonarAggsPlanStringAgg( priv, &group, e );
                }
            }
            else if( IsA( expr, Param ) )
            {
                sonarAggsPlanParam( priv, &group, e);
            }

        }

        rc = bson_append_document_end( &groupi, &group ); // count
        ASSERT_BSON_OK( rc );

        rc = bson_append_document_end(&sbp, &groupi ); // group
        ASSERT_BSON_OK( rc );
        
        if( priv->o )
        {
            rc = bson_append_document( &sbp, array_index( &au ), 1,  priv->o ); 
            ASSERT_BSON_OK( rc );
        }



        rc = bson_append_array_end( priv->g, &sbp ); // pipeline
        ASSERT_BSON_OK( rc );
    }
    return true;
}


TupleTableSlot *
sa_iterate(ForeignScanState *node)
{
    struct sigaction old;
	TupleTableSlot *slot = node->ss.ss_ScanTupleSlot;
	ForeignScan *scanstate = (ForeignScan *) node->ss.ps.plan;
	psc_private priv = lfirst( scanstate->fdw_private->head ); 

    const bson_t *r;
	bson_type_t t = BSON_TYPE_EOD;

	ListCell *c = NULL;
	int fi = 0;

    node->ss.ps.state->es_private = ( ResultRelInfo *)  priv ;

    sp_suspend_signal( SIGALRM, &old ); 
	if( mongoc_cursor_next( priv->uri->cursor, &r) )
	{
        bson_iter_t it;

        memset( slot->tts_values, 0, slot->tts_tupleDescriptor->natts * sizeof(Datum));
        memset( slot->tts_isnull, true, slot->tts_tupleDescriptor->natts * sizeof(bool));

        ExecClearTuple(slot);

        foreach( c, priv->a)
        {
            char agg_name[ 8 ] = { 0 };
            const bson_value_t * v ;
            sa_result s = ( sa_result ) lfirst( c );

            sprintf( agg_name, "%d", s->resno ); 


            
            if( s->e == SONAR_AGG_PARAM )
            {
                PlannerInfo *root = priv->root;

                if( root->glob->subroots )
                {
                    PlannerInfo *subroot;
                    ListCell *cell;

//XXX there is much more work to do here. We treate it as the simplest case
                    foreach( cell, root->glob->subroots )
                    {
                        psc_private ref;

                        subroot = lfirst( cell );

                        ref = lfirst( ( (List*) subroot->join_search_private )->head );


                        if( ref->a )
                        {
                            SonarAggResult *r = lfirst( ref->a->head );
                            if( r->t == s->t )
                            {
                                s->d = r->d;
                            }
                            else
                            {
                                s->d = 0;
                            }
                        }
                    }
                }
            }
            else
            {
                bson_iter_init_find( &it, r, agg_name );
                if( s->e == SONAR_AGG_AVG )
                {
                    SU_BSON_VAL( &it );
                    SU_VAL_TYPE( v );

                    if( t == BSON_TYPE_DOUBLE )
                    {
                        if( s->t == FLOAT8OID )
                            s->d = Float8GetDatum( (float8) SU_TYPE_VAL( double ) );
                        if( s->t == NUMERICOID ) 
                            s->d = ( Datum )su_float8_to_numeric( (float8) SU_TYPE_VAL( double ) );
                    }
                    else if( t == BSON_TYPE_INT32 )
                    {
                        s->d = Int64GetDatum( (int64)SU_TYPE_VAL( int32 ) );
                    }
                    else if( t == BSON_TYPE_UTF8 )
                    {
                        s->d = CStringGetDatum( SU_TYPE_STR( utf8 ) );
                    }
                }
                else
                {
                    SU_BSON_VAL( &it );
                    SU_VAL_TYPE( v );

                    if( t == BSON_TYPE_DOUBLE )
                    { 
                        s->d = Float8GetDatum( (float8)SU_TYPE_VAL( double ) );
                    }
                    else if( t == BSON_TYPE_INT32 )
                    {
                        s->d = Int64GetDatum( (int64)SU_TYPE_VAL( int32 ) );
                    }
                    else if( t == BSON_TYPE_UTF8 )
                    {
                        if( s->t == TEXTOID )
                        {
                            s->d = CStringGetTextDatum( SU_TYPE_STR( utf8 ) );
                        }
                        else
                            s->d = CStringGetDatum( SU_TYPE_STR( utf8 ) );
                    }
                    else if( t == BSON_TYPE_INT64 )
                    {
                        s->d = Int64GetDatum( SU_TYPE_VAL( int64 ) );
                    }
                    else if( t == BSON_TYPE_DATE_TIME )
                    {
                        if( s->t == TIMESTAMPOID )
                        {
                            //float8 d =  946684800000000; // ( POSTGRES_EPOCH_JDATE - UNIX_EPOCH_JDATE ) * 24 * 3600 * 1000 * 1000 ;
                            float8 f = (float8)( SU_TYPE_VAL( datetime )  * 1000 - PGUNIX_TSDIFF  )  ;
                            s->d = TimestampGetDatum( f );
                        }
                    }
                    else if( t == BSON_TYPE_BOOL )
                    {
                        if( s->t == BOOLOID )
                        {
                            s->d = BoolGetDatum( SU_TYPE_VAL( bool ) );
                        }
                    }
                }
            }

        }

         slot->tts_tupleDescriptor->attrs[0]->attrelid = priv->id;
         slot->tts_isnull[0] = true;

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

        sp_resume_signal( SIGALRM, &old ); 
        return slot;
    }
    sp_resume_signal( SIGALRM, &old ); 
    return 0;
}


void
sa_scan( psc_private priv )
{
    if( priv->uri->cursor == 0 )
        su_aggregate( priv );
}


sa_result sonar_make_agg_node( sonar_agg_enum e, int16 res, Oid t )
{
	sa_result r = sonar_create_sa_result();
	r->e = e;
    r->resno = res;
    r->t = t;
	return r;
}

sa_result
sonar_create_sa_result()
{
	SonarAggResult * sr = ( SonarAggResult*) makeSonarNode ( SonarAggResult );
	//SonarAggResult * sr = ( SonarAggResult*) makeSonarNode ( SonarAggResult );
	sr->d = 0;
	return sr;
}

void
sonar_free_sa_result( sa_result * r )
{
	sa_result s = *r;

	if( s->d )
	{
		free( ( void *)s->d );
	}

	free( s );
	*r = 0;
}

bool 
sa_plan_rescan( psc_private  priv, Var* v, Datum d )
{
    if( priv->f )
        bson_destroy( priv->f );

    return sa_plan_scan( priv, v, d );

}
