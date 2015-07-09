
/*! sonar_fbson.c:  build function as a meta bson node
 * Date: : Fri Feb  6 10:21:23 PST 2015
 * Author : CUI, SHU HAI
 */

#include "sonar_utils.h"
#include "sonar_fbson.h"

void sf_opmath_bson( psc_private priv,  bson_t *b, OpExpr* opxpr )
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
        bson_t auxb;
        switch( opid )
        {
            case SONA_ADD:
                rc = BSON_APPEND_ARRAY_BEGIN( b, "$add", &auxb );
                ASSERT_BSON_OK( rc );
                break;
            case SONA_SUB:
                rc = BSON_APPEND_ARRAY_BEGIN( b, "$subtract", &auxb );
                ASSERT_BSON_OK( rc );
                break;
            case SONA_MUL:
                rc = BSON_APPEND_ARRAY_BEGIN( b, "$multiply", &auxb );
                ASSERT_BSON_OK( rc );
                break;
            case SONA_DIV:
                rc = BSON_APPEND_ARRAY_BEGIN( b, "$divide", &auxb );
                ASSERT_BSON_OK( rc );
                break;
            case SONA_MDO:
                rc = BSON_APPEND_ARRAY_BEGIN( b, "$mod", &auxb );
                ASSERT_BSON_OK( rc );
                break;
            case SONA_CAT:
                rc = BSON_APPEND_ARRAY_BEGIN( b, "$concat", &auxb );
                ASSERT_BSON_OK( rc );
                break;
            default:
            //XX sl_log()
            break;
        }

        foreach( c, args )
        {
            Expr *xpr = lfirst( c );
            idx = array_index( &au );

            if( IsA( xpr, Var ) )
            {
                Var *v = (Var*)xpr;
                rc = BSON_APPEND_UTF8( &auxb, idx, sonar_prepend( field, priv->nm[ v->varattno -1].sn, "$" ));
            }
            else if( IsA( xpr, Const ) )
            {
                rc = BSON_APPEND_DOUBLE( &auxb, idx, sonar_const_to_scalar( (Const*)xpr ) );
            }
            else if( IsA( xpr, OpExpr ) )
            {
                bson_t *ob = bson_new();
                sf_opmath_bson( priv, ob, (OpExpr*)xpr );
                rc = BSON_APPEND_DOCUMENT( &auxb, idx, ob );
                bson_destroy( ob );
            }
            else
            {
                //rc = BSON_APPEND_UTF8( &auxb, idx, fld1 );
            }
            ASSERT_BSON_OK( rc );
        }

        bson_append_document_end( b, &auxb );
    }
}

void sf_opcat_bson( psc_private priv,  bson_t *b, OpExpr* opxpr )
{

    int rc = 0;
    char field[ NAMEDATALEN ] = {0};
    const char *idx;
    array_unit au = { 0 };	
    ////idx = array_index( au );

    ListCell *c;
    List *args = opxpr->args;

    bson_t ba;

    rc = BSON_APPEND_ARRAY_BEGIN( b, "$concat", &ba );
    ASSERT_BSON_OK( rc );

    foreach( c, args )
    {
        Expr *xpr = lfirst( c );

        idx = array_index( &au );
        if( IsA( xpr, Var ) )
        {
            Var *v = (Var*)xpr;
            rc = BSON_APPEND_UTF8( &ba, idx, sonar_prepend( field, priv->nm[ v->varattno -1 ].sn, "$") );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( c, Const ) )
        {
        }
    }

    bson_append_array_end( b, &ba );
}

void sf_substr_bson( psc_private priv,  bson_t *b, FuncExpr* fxpr )
{
    int rc = 0;
    bson_t ba;
    char field[ NAMEDATALEN ] = {0};
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    int start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
    int len= ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue;
    Expr *x = lfirst( fxpr->args->head );

    if( IsA( x, Var ) )
    {
        Var *v = ( Var * )x;
        sprintf( projval, "%s", priv->nm[ v->varattno - 1].sn );
    }
    else if( IsA( x, CoerceViaIO ) )
    {
       CoerceViaIO *cvi = (CoerceViaIO*)x;

       if( cvi->coerceformat == COERCE_EXPLICIT_CAST )
       {

            sprintf( projval, "%s_%x", "coerce", (unsigned int ) (uintptr_t )cvi->arg );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "%s_%x", funcname, (unsigned int ) (uintptr_t )fx->args );
    }


    rc = BSON_APPEND_ARRAY_BEGIN( b, "$substr", &ba );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( field, projval, "$") );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_INT32( &ba, "1", start );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_INT32( &ba, "2", len );
    ASSERT_BSON_OK( rc );

    bson_append_array_end( b, &ba );
}

void sf_lowerupper_bson( psc_private priv,  bson_t *b, FuncExpr* fxpr )
{
    int rc = 0;
    char field[ NAMEDATALEN ] = {0};
    //char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    const char * funcname = get_func_name( fxpr->funcid );

    //bson_t *bp = bson_new();
    Expr *x = lfirst( fxpr->args->head );

    //sprintf( projkey, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );

    if( IsA( x, Var ) )
    {
        Var *v = ( Var * )x;
        sprintf( projval, "%s", priv->nm[ v->varattno - 1].sn );
    }
    else if( IsA( x, CoerceViaIO ) )
    {
       CoerceViaIO *cvi = (CoerceViaIO*)x;

       if( cvi->coerceformat == COERCE_EXPLICIT_CAST )
       {
            sprintf( projval, "%s_%x", "coerce", (unsigned int ) (uintptr_t )cvi->arg );
            //sp_project_coerce_deep( priv, org, cvi );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "$%s_%x", funcname, (unsigned int ) (uintptr_t )fx->args );
        //sp_project_func_deep( priv, org, fx);
    }

    if( strcmp( funcname, "lower" ) == 0  )
        rc = BSON_APPEND_UTF8( b, "$toLower", sonar_prepend( field, projval, "$") );
    else
        rc = BSON_APPEND_UTF8( b, "$toUpper", sonar_prepend( field, projval, "$") );
    ASSERT_BSON_OK( rc );
    //sp_project_lowerupper( bp, projkey, projval, funcname );
    //priv->projs1[ org->resno -1 ] = sl_lappend( priv->projs1[ org->resno -1 ], bp );
}
