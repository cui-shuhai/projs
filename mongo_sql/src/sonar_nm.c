#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_list.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_func.h"
//#include "catalog/pg_foreign_server.h"
//#include "catalog/pg_foreign_table.h"
//#include "catalog/pg_user_mapping.h"


#define META_COLLECTION "pg_sonar_name_map"

static void sonar_collect_where_interests( psc_private priv, List * l );
static void sonar_collect_join_interests( psc_private priv );

Spnm sn_build_nm( psc_private priv )
{
    int i = 0;
    RelOptInfo *baserel = priv->baserel;

	bson_t q;
	bson_t f;
	const bson_t *r;
    bson_error_t error;

	char db_meta_node[ 64 ] = { 0 };
	char db_node[ 64 ] = {0};

    Spnm m = malloc( ( baserel->max_attr ) * sizeof( SpnmData ) );

    if( !m )
    {
        //errMsg( "Error allocating memory for name map \n" );
        return 0;
    }

    memset( m, 0,  ( baserel->max_attr ) * sizeof( SpnmData ) );

    for( i = 0; i < baserel->max_attr; i++ )
    {
        su_namecpy( m[i].pn, get_relid_attribute_name( priv->id, i+1 ) );
    }

	sprintf( db_node, ".%s.%s$", priv->uri->db_name, priv->uri->collection_name );
	sprintf( db_meta_node, "%s.%s", priv->uri->db_name, META_COLLECTION );


	bson_init( &q );
	bson_append_regex( &q, "name", strlen( "name" ), db_node, "i" );

	bson_init( &f );

    BSON_APPEND_BOOL( &f, "field_name", true );
    BSON_APPEND_BOOL( &f, "sql_info", true );
    BSON_APPEND_BOOL( &f, "_id", false);

    sm_query_db( priv->uri, priv->uri->db_name, META_COLLECTION, 0, 0, &q, &f );

	while( mongoc_cursor_next( priv->uri->cursor, &r) )
	{
        const bson_value_t *v;
        bson_type_t t;
		bson_iter_t it;
		bson_iter_t it0;
        const char *pgn = 0;
        const char *snn = 0;
        const char *apn = 0;

        bson_iter_init( &it, r );

        if( bson_iter_find( &it, "field_name" ) )
        {
            SU_BSON_VAL( &it );
            SU_VAL_TYPE( v );

            snn = SU_TYPE_STR( utf8 );
        }

        bson_iter_init( &it, r );

        if( bson_iter_find_descendant( &it, "sql_info.pg_name", &it0 ) )
        {
            SU_BSON_VAL( &it0 );
            pgn = SU_TYPE_STR( utf8 ); 
        }

        bson_iter_init( &it, r );

        if( bson_iter_find_descendant( &it, "sql_info.unwind", &it0 ) )
        {
            SU_BSON_VAL( &it0 );
            apn = SU_TYPE_STR( utf8 ); 
        }


        if( pgn && snn )
        {
            int i = 0;
            for( ; i < baserel->max_attr; i++ )
            {
                if( !strcmp( m[i].pn, pgn ) )
                {
                    su_namecpy( m[i].sn, snn );

                    if( apn )
                        sf_strdup( apn, (char**)&m[i].ap ); 

                    break;
                }
            }
        }
        else
        {
            char msg[256] = { 0 };
            sprintf( msg, "cannot find mapped field name for %s", pgn );
            sl_log( FATAL,  "query column -> field map failed", msg ); 
        }
    }

    //if( (( PARTIAL_CURSOR*)priv->uri->cursor)->failed )
    if (mongoc_cursor_error(priv->uri->cursor, &error))
    {
        //sl_err( &(( PARTIAL_CURSOR*)priv->uri->cursor)->error );
        sl_err( __func__,  &error );
    }


    priv->nm = m;
    bson_destroy( &q );
    bson_destroy( &f );
    mongoc_cursor_destroy( priv->uri->cursor );
    priv->uri->cursor = 0;
    return 0;
}

void su_collect_opexpr_interests( 
                    psc_private priv,
                    OpExpr *oxpr )
{
    ListCell *oc;
    
    foreach( oc, oxpr->args )
    {
        Var *v = (Var*)lfirst( oc );
        if( IsA( v, Var ) )
        {
            sonar_append_targetvar( priv, v );
        }
        else if( IsA( v, OpExpr ) )
        {
            su_collect_opexpr_interests( priv, (OpExpr*)v );
        }
        else if( IsA( v, FuncExpr ) )
        {
            su_collect_funcexpr_interests( priv, ( FuncExpr*) v );
        }
    }
}

void su_collect_funcexpr_interests( 
                    psc_private priv,
                    FuncExpr *funxpr )
{
    ListCell *oc;
    
    foreach( oc, funxpr->args )
    {
        Var *v = (Var*)lfirst( oc );
        if( IsA( v, Var ) )
        {
            sonar_append_targetvar( priv, v );
        }
        else if( IsA( v, OpExpr ) )
        {
            su_collect_opexpr_interests( priv, (OpExpr*)v );
        }
        else if( IsA( v, FuncExpr ) )
        {
            su_collect_funcexpr_interests( priv, ( FuncExpr*) v );
        }
    }
}

void sonar_collect_where_interests( psc_private priv, List * l )
{
    ListCell *c = NULL;

    foreach( c, l )
    {
        Expr *x = lfirst( c );

        if( IsA( x, Var ) )
        {
            sonar_append_targetvar( priv, (Var*)x );
        }
        else if( IsA( x, RestrictInfo ) )
        {
            Expr * expr = (Expr*) ( ( RestrictInfo * ) x)->clause;
            if( IsA( expr, BoolExpr ) )
            {
                BoolExpr *bxr = (BoolExpr*)expr;

                if( bxr->boolop == NOT_EXPR )
                {
                        Var * v = ( Var *) lfirst( bxr->args->head ) ;
                        if( IsA( v , Var ) )
                        {
                            sonar_append_targetvar( priv, v );
                        }
                }
                else
                    sonar_collect_where_interests( priv,  ((BoolExpr*)expr)->args );
            }
            else if( IsA( expr, OpExpr ) )
            {
                su_collect_opexpr_interests( priv, ( OpExpr*) expr );
            }
            else if( IsA( expr, ScalarArrayOpExpr ) )
            {
                ListCell *ac;
                ScalarArrayOpExpr * axpr = (ScalarArrayOpExpr*) expr;

                foreach( ac, axpr->args )
                {
                    Var *v = (Var*)lfirst( ac );
                    if( IsA( v, Var ) )
                            sonar_append_targetvar( priv, v );
                }
            }
            else if( IsA( expr, NullTest ) )
            {
                NullTest * ntexpr = (NullTest*) expr;
                Var * v = ( Var *) ntexpr->arg; 
                if( IsA( v, Var) )
                    sonar_append_targetvar( priv, v );

            }
        }
        else if( IsA( x, BoolExpr ) )
        {
            BoolExpr *bxr = (BoolExpr*)x;

            if( bxr->boolop == NOT_EXPR )
            {
                    Var * v = ( Var *) lfirst( bxr->args->head ) ;
                    if( IsA( v , Var ) )
                    {
                        sonar_append_targetvar( priv, v );
                    }
            }
            else
                sonar_collect_where_interests( priv,  ((BoolExpr*)x)->args );
        }
        else if( IsA( x, OpExpr ) )
        {
            su_collect_opexpr_interests( priv, ( OpExpr*) x );
        }
        else if( IsA( x, ScalarArrayOpExpr ) )
        {
            ListCell *ac;
            ScalarArrayOpExpr * axpr = (ScalarArrayOpExpr*) x;

            foreach( ac, axpr->args )
            {
                Var *v = (Var*)lfirst( ac );
                if( IsA( v, Var ) )
                        sonar_append_targetvar( priv, v );
            }
        }
        else if( IsA( x, NullTest ) )
        {
            NullTest * ntexpr = (NullTest*) x;
            Var * v = ( Var *) ntexpr->arg; 
            if( IsA( v, Var) )
                sonar_append_targetvar( priv, v );

        }
    }
}

void sn_collect_interests( psc_private priv )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;

    //targetlist contains fields in SELECT vars and SORT vars
    if (baserel->reltargetlist)
        priv->l = sl_var_list_copy(baserel->reltargetlist);

    if( priv->t != query_sonar_join )
    {
        if( baserel->baserestrictinfo )
            sonar_collect_where_interests( priv, baserel->baserestrictinfo );
        if( root->hasJoinRTEs )
            sonar_collect_join_interests( priv );
    }
}

void sonar_nm_release( psc_private priv )
{
    if( priv->nm )
    {
        free( priv->nm );
        priv->nm = 0;
    }

}

void sonar_collect_join_interests( psc_private priv )
{
    
    FromExpr * fxpr ;
    ListCell *c;
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;

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

                if( oxpr->args && oxpr->args->length > 0 )
                {
                    ListCell *vc;
                    foreach( vc, oxpr->args )
                    {
                        Expr *x = ( Expr * ) lfirst( vc );
                        RelOptInfo * tbr;

                        if( IsA( x, Var ) )
                        {
                            Var *v = (Var*)x;
                            tbr = find_base_rel( root, v->varno );
                            if( tbr == baserel )
                            {
                                sonar_append_targetvar( priv, v );
                            }
                        }
                        else if( IsA( x, RelabelType ) )
                        {
                            RelabelType *r = ( RelabelType * )x;
                            Var *v = (Var*) r->arg;
                            if( IsA( v, Var ) )
                            {
                                tbr = find_base_rel( root, v->varno );
                                if( tbr == baserel )
                                {
                                    sonar_append_targetvar( priv, v );
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
