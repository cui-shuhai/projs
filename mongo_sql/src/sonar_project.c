/*
 * sonar_project.c
 *
 *  Created on: Fri Nov 21 11:29:50 PST 2014
 *      Author: CUI, SHU HAI
 */

#include "sonar_utils.h"
#include "sonar_list.h"
#include "sonar_project.h"

void sp_project_var_restrict(
		 psc_private priv,
		 List **ll,
         const Var *v)
{
    int rc = 0;
    List *l = 0;
    ListCell *lc;
    bson_t *b;

    char projkey[ NAMEDATALEN ] = {0};
    sprintf( projkey, "%s", priv->nm[v->varattno-1].sn );

    foreach( lc, priv->projs )
    {
        ListCell *c;
        List *projs = lfirst( lc );

        foreach( c, projs )
        {
            bson_t *eb = lfirst( c );
            const char *key = 0;
            bson_iter_t it;
            bson_iter_init( &it, eb );

            if( bson_iter_next( &it ) )
            {
                key = bson_iter_key( &it );

                if( strlen( key ) == strlen( projkey ) && strcmp( projkey, key ) == 0 )
                    return;
            }
        }
    }

    b = bson_new();
    rc = BSON_APPEND_INT32( b, projkey, 1);
    ASSERT_BSON_OK( rc );

    if( !*ll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}

void sp_project_func(
		bson_t *b,
		const char *projkey,
		FuncExpr *f )
{
    int rc = 0;
    char projval[ NAMEDATALEN ] = {0};
    const char * funcname = get_func_name( f->funcid );

    sprintf( projval, "$%s_%x", funcname, (unsigned int ) (uintptr_t )f->args );

    rc = BSON_APPEND_UTF8( b, projkey, projval );
    ASSERT_BSON_OK( rc );

}

void sp_project_func_deep(
		psc_private priv,
		TargetEntry * org,
		FuncExpr *f )
{
    const char * funcname = get_func_name( f->funcid );

    if( (strcmp( funcname, "substring" ) == 0 ||  strcmp( funcname, "substr" ) == 0  )&& f->args->length == 3 )
    {
        sp_project_substr_deep( priv, org, f ); 
    }
    else if( strcmp( funcname, "lower" ) == 0 || strcmp( funcname, "upper" ) == 0 )
    {

        sp_project_lowerupper_deep( priv, org, f );
    }
    else if( strcmp( funcname, "textcat" ) == 0 )
    {
        sp_project_textcat_deep( priv, org, f );
    }
    else
    {

    }
}

void sp_project_func_restrict(
		 psc_private priv,
		 TargetEntry * org,
		 List **ll,
		 FuncExpr *f )
{
    const char * funcname = get_func_name( f->funcid );

    if( (strcmp( funcname, "substring" ) == 0 ||  strcmp( funcname, "substr" ) == 0  )&& ( f->args->length == 3 || f->args->length == 2 ) ) 
    {
        sp_project_substr_restrict( priv, org, ll, f ); 
    }
    else if( strcmp( funcname, "lower" ) == 0 || strcmp( funcname, "upper" ) == 0 )
    {

        sp_project_lowerupper_restrict( priv, ll, f );
    }
    else if( strcmp( funcname, "textcat" ) == 0 )
    {
        sp_project_textcat_restrict( priv, ll, f );
    }
    else
    {

    }
}



void sp_project_math(
		 bson_t *b,
		 const char *key,
         snop_id opid,
         const char* fld1,
         const char * fld2)
{
    int rc = 0;
    bson_t auxd;
    bson_t auxb;
    rc = BSON_APPEND_DOCUMENT_BEGIN( b, key, &auxd );
    ASSERT_BSON_OK( rc );
    switch( opid )
    {
        case SONA_ADD:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$add", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_SUB:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$subtract", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_MUL:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$multiply", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_DIV:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$divide", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_MDO:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$mod", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_CAT:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$concat", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        default:
        rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$add", &auxb );
        //XX sl_log()
        break;
    }
    rc = BSON_APPEND_UTF8( &auxb, "0", fld1 );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_UTF8( &auxb, "1", fld2 );
    ASSERT_BSON_OK( rc );
    bson_append_array_end( &auxd, &auxb );
    bson_append_document_end( b, &auxd );
}

void sp_project_math_vconst(
		 bson_t *b,
		 const char *key,
         snop_id opid,
         const char* fld1,
         const Const * fld2)
{
    int rc = 0;
    bson_t auxd;
    bson_t auxb;
    rc = BSON_APPEND_DOCUMENT_BEGIN( b, key, &auxd );
    ASSERT_BSON_OK( rc );
    switch( opid )
    {
        case SONA_ADD:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$add", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_SUB:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$subtract", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_MUL:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$multiply", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_DIV:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$divide", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        default:
        rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$add", &auxb );
        //XX sl_log()
        break;
    }
    rc = BSON_APPEND_UTF8( &auxb, "0", fld1 );
    ASSERT_BSON_OK( rc );

	switch (fld2->consttype)
	{
		case INT2OID:
		case INT4OID:
			// append int
			rc = BSON_APPEND_INT32( &auxb, "1", fld2->constbyval ? fld2->constvalue : *(int*)fld2->constvalue );
			ASSERT_BSON_OK(rc);
			break;
		case INT8OID:
			// append long
			rc = BSON_APPEND_INT64( &auxb, "1", fld2->constbyval ? fld2->constvalue : *(long*)fld2->constvalue );
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_INT64( &auxb, "1", fld2->constbyval ? fld2->constvalue : *(long*)fld2->constvalue );
			ASSERT_BSON_OK(rc);
			break;
		break;

		case BOOLOID:
			rc = bson_append_bool( &auxb, "$exist", -1, fld2->constbyval ? fld2->constvalue : fld2->constvalue) ;
			ASSERT_BSON_OK(rc);
			break;


	}

    bson_append_array_end( &auxd, &auxb );
    bson_append_document_end( b, &auxd );
}

void sp_project_math_constv(
		 bson_t *b,
		 const char *key,
         snop_id opid,
         const Const * fld1,
         const char* fld2)
{
    int rc = 0;
    bson_t auxd;
    bson_t auxb;
    rc = BSON_APPEND_DOCUMENT_BEGIN( b, key, &auxd );
    ASSERT_BSON_OK( rc );
    switch( opid )
    {
        case SONA_ADD:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$add", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_SUB:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$subtract", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_MUL:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$multiply", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        case SONA_DIV:
            rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$divide", &auxb );
            ASSERT_BSON_OK( rc );
            break;
        default:
        rc = BSON_APPEND_ARRAY_BEGIN( &auxd, "$add", &auxb );
        //XX sl_log()
        break;
    }

	switch (fld1->consttype)
	{
		case INT2OID:
		case INT4OID:
			// append int
			rc = BSON_APPEND_INT32( &auxb, "0", fld1->constbyval ? fld1->constvalue : *(int*)fld1->constvalue );
			ASSERT_BSON_OK(rc);
			break;
		case INT8OID:
			// append long
			rc = BSON_APPEND_INT64( &auxb, "0", fld1->constbyval ? fld1->constvalue : *(long*)fld1->constvalue );
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_INT64( &auxb, "0", fld1->constbyval ? fld1->constvalue : *(long*)fld1->constvalue );
			ASSERT_BSON_OK(rc);
			break;
		break;

		case BOOLOID:
			rc = bson_append_bool( &auxb, "$exist", -1, fld1->constbyval ? fld1->constvalue : fld1->constvalue) ;
			ASSERT_BSON_OK(rc);
			break;
	}

    rc = BSON_APPEND_UTF8( &auxb, "1", fld2 );
    ASSERT_BSON_OK( rc );

    bson_append_array_end( &auxd, &auxb );
    bson_append_document_end( b, &auxd );
}

void sp_project_math_deep(
		psc_private priv,
		TargetEntry * org,
		const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    const char * funcname = get_func_name( opxpr->opfuncid );
    char operand_fld1[ NAMEDATALEN ] = {0};
    char operand_fld2[ NAMEDATALEN ] = {0};
	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );

    bson_t *b = bson_new();
    Expr *x1 = lfirst( opxpr->args->head );
    Expr *x2 = lfirst( opxpr->args->head->next );

    sprintf( projkey, "%s_%x", funcname, (unsigned int ) (uintptr_t )opxpr->args );

    if( IsA( x1, Var ) && IsA( x2, Var ))
    {
        Var *v1 = (Var*)x1;
        Var *v2 = (Var*)x2; 
        sprintf( operand_fld1, "$%s", priv->nm[ v1->varattno -1 ].sn );
        sprintf( operand_fld2, "$%s", priv->nm[ v2->varattno -1 ].sn );
        sp_project_math( b, projkey, opid,  operand_fld1, operand_fld2 );
    }
    else if( IsA( x1, Var ) || IsA( x2, Var ))
    {
        const Var *v;
        const Const *c;

        if( IsA( x1, Var ) )
        {
            v = (Var*)x1;
            c = (Const*)x2; 
        }
        else
        {
            v = (Var*)x2;
            c = (Const*)x1; 
        }

        sprintf( operand_fld1, "$%s", priv->nm[ v->varattno -1 ].sn );
        sp_project_math_vconst( b, projkey, opid,  operand_fld1,  c );
    }
    else
    {
        //XXX sl_log
    }

    priv->projs1[ org->resno -1 ] = sl_lappend( priv->projs1[ org->resno -1 ], b );
}

void sp_project_math_restrict(
		 psc_private priv,
		 List **ll,
		 const OpExpr *opxpr )
{
    bool topll = false;
    List *l = 0;
    bson_t *b = bson_new();

    if(  !*ll )
    {
        topll = true;
    }

    if( opxpr->args->length == 2 )
    {
        Expr *xpr1 = lfirst( opxpr->args->head );
        Expr *xpr2 = lfirst( opxpr->args->head->next );

        if( IsA( xpr1, Var ) && IsA( xpr2, Var ) )
        {
            sp_project_math_var_var( priv, b, opxpr );
        }
        else if( IsA( xpr1, Var ) && IsA( xpr2, Const ) )
        {
            sp_project_math_var_const( priv, b, opxpr );
        }
        else if( IsA( xpr1, Const ) && IsA( xpr2, Var ) )
        {
            sp_project_math_const_var( priv, b, opxpr );
        }
        else if( IsA( xpr1, OpExpr ) && IsA( xpr2, Var ) )
        {
            sp_project_math_opxpr_var( priv, ll, b, opxpr );
        }
        else if( IsA( xpr1, Var) && IsA( xpr2, OpExpr ) )
        {
            sp_project_math_var_opxpr( priv, ll, b, opxpr );
        }
        else if( IsA( xpr1, OpExpr ) && IsA( xpr2, Const ) )
        {
            sp_project_math_opxpr_const( priv, ll, b, opxpr );
        }
        else if( IsA( xpr1, Const) && IsA( xpr2, OpExpr ) )
        {
            sp_project_math_const_opxpr( priv, ll, b, opxpr );
        }
    }

    if( topll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}

void sp_project_xcat(
		bson_t *b,
		const char *dum_fld,
		const char* fld1,
		const char* fld2 )
{
    int rc = 0;
    bson_t bs;
    bson_t ba;
    char field[ NAMEDATALEN ] = {0};

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, dum_fld, &bs );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$concat", &ba );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( field, fld1, "$") );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_UTF8( &ba, "1", sonar_prepend( field, fld2, "$") );
    ASSERT_BSON_OK( rc );


    bson_append_array_end( &bs, &ba );
    bson_append_document_end( b, &bs );
}

void sp_project_xcat_raw(
		bson_t *b,
		const char *dum_fld,
		const char* fld1,
		const char* fld2 )
{
    int rc = 0;
    bson_t bs;
    bson_t ba;

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, dum_fld, &bs );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$concat", &ba );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_UTF8( &ba, "0", fld1 );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_UTF8( &ba, "1", fld2 );
    ASSERT_BSON_OK( rc );


    bson_append_array_end( &bs, &ba );
    bson_append_document_end( b, &bs );
}


void sp_project_concat_args(
		 psc_private priv,
		 bson_t *b,
		 const char *dum_fld,
		 const List * flds)
{
    array_unit au = {0};
    ListCell *c;
    int rc = 0;
    bson_t bs;
    bson_t ba;
    char field[ NAMEDATALEN ] = {0};

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, dum_fld, &bs );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$concat", &ba );
    ASSERT_BSON_OK( rc );

    foreach( c, flds )
    {
        Expr *xpr = lfirst( c );

        if( IsA( xpr, Var ) )
        {
            const Var *v = (Var*)xpr;
            rc = BSON_APPEND_UTF8( &ba, array_index( &au ), sonar_prepend( field, priv->nm[v->varattno -1].sn ,"$") );
        }
        else if( IsA( xpr, Const ) )
        {
            const char *cv = ((text*)DatumGetTextP(( (Const*)xpr)->constvalue ))->vl_dat;
            rc = BSON_APPEND_UTF8( &ba, array_index( &au ), cv );
        }
        else
        {
            //sl_log;
        }
    }

    bson_append_array_end( &bs, &ba );
    bson_append_document_end( b, &bs );
}

void sp_project_concatws_args(
		 psc_private priv,
		 bson_t *b,
		 const char *dum_fld,
		 const List * flds)
{
    array_unit au = {0};
    const char *idx;
    ListCell *c;
    int rc = 0;
    bson_t bs;
    bson_t ba;
    char separator[ NAMEDATALEN ] = {0};
    char field[ NAMEDATALEN ] = {0};
    Expr *xpr;
    bool first = true;
    const char *cv;

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, dum_fld, &bs );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$concat", &ba );
    ASSERT_BSON_OK( rc );

    c = flds->head;
    xpr = lfirst( c );

    if( IsA( xpr, Var ) )
    {
        const Var *v = (Var*)xpr;
        sprintf( separator, "$%s",  priv->nm[v->varattno -1].sn );
    }
    else if( IsA( xpr, Const ) )
    {
        sprintf( separator, "%s",  ((text*)DatumGetTextP(( (Const*)xpr)->constvalue ))->vl_dat );
    }

    c = c->next;

    while( c )
    {
        xpr = lfirst( c );

        if( !first )
        {
            rc = BSON_APPEND_UTF8( &ba, array_index( &au ), separator );
        }

        if( IsA( xpr, Var ) )
        {
            const Var *v = (Var*)xpr;
            rc = BSON_APPEND_UTF8( &ba, array_index( &au ), sonar_prepend( field, priv->nm[v->varattno -1].sn ,"$") );
        }
        else if( IsA( xpr, Const ) )
        {
            const char *cv = ((text*)DatumGetTextP(( (Const*)xpr)->constvalue ))->vl_dat;
            rc = BSON_APPEND_UTF8( &ba, array_index( &au ), cv );
        }

        first = false;
        c = c->next;

    }


    bson_append_array_end( &bs, &ba );
    bson_append_document_end( b, &bs );
}


void sp_project_concat_deep(
		psc_private priv,
		TargetEntry * org,
		const OpExpr *opxpr )
{
#if 0
    int rc = 0;
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    int start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
    int len= ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue;
    const char *funcname = get_func_name( fxpr->funcid );

    bson_t *b = bson_new();

    sp_project_substr( b, projkey, projval, start, len );
    priv->projs1[ org->resno -1 ] = lappend( priv->projs1[ org->resno -1 ], b );

#endif
}

//XXX concat can take any number of parameters
void sp_project_concat_restrict(
		 psc_private priv,
		 List **ll,
		 const  FuncExpr *fxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    List *l = 0;

    const char *fn = get_func_name( fxpr->funcid );
    bson_t *b = bson_new();

    sprintf( projkey, "%s_%x", fn, (unsigned int ) (uintptr_t )fxpr->args );

    sp_project_concat_args( priv,  b, projkey, fxpr->args ); 


    if( !*ll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
        *ll = l;
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}

//XXX concat can take any number of parameters
void sp_project_concatws_restrict(
		 psc_private priv,
		 List **ll,
		 const  FuncExpr *fxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    List *l = 0;

    const char *fn = get_func_name( fxpr->funcid );
    bson_t *b = bson_new();

    sprintf( projkey, "%s_%x", fn, (unsigned int ) (uintptr_t )fxpr->args );

    sp_project_concatws_args( priv,  b, projkey, fxpr->args ); 


    if( !*ll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
        *ll = l;
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}

void sp_project_opcat_restrict(
		 psc_private priv,
		 List **ll,
		 const OpExpr *opxpr )
{
    int rc = 0;
    char projkey[ NAMEDATALEN ] = {0};
    array_unit au = { 0 };
    List *l = 0;

    const char *fn = get_func_name( opxpr->opfuncid );
    List *args = opxpr->args;
    bson_t *b = bson_new();
    bson_t bd;
    bson_t ba;

    sprintf( projkey, "%s_%x", fn, (unsigned int ) (uintptr_t )args );

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, projkey, &bd );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bd, "$concat", &ba );
    ASSERT_BSON_OK( rc );

    sp_project_opcat_opxpr( priv, ll, &ba, &au, opxpr );
    bson_append_array_end( &bd, &ba );
    bson_append_document_end( b, &bd );

    if( !*ll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
        *ll = l;
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}


void sp_project_textcat(
		bson_t *b,
		const char *dum_fld,
		const char* fld1,
		const char* fld2 )
{
    int rc = 0;
    bson_t bs;
    bson_t ba;
    char field[ NAMEDATALEN ] = {0};

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, dum_fld, &bs );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$concat", &ba );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( field, fld1, "$") );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_UTF8( &ba, "1", "" );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_UTF8( &ba, "2", sonar_prepend( field, fld2, "$") );
    ASSERT_BSON_OK( rc );


    bson_append_array_end( &bs, &ba );
    bson_append_document_end( b, &bs );
}

void sp_project_textcat_deep(
		psc_private priv,
		TargetEntry * org,
		FuncExpr *f )
{
#if 0
    int rc = 0;
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    int start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
    int len= ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue;
    const char *funcname = get_func_name( fxpr->funcid );

    bson_t *b = bson_new();

    sp_project_substr( b, projkey, projval, start, len );
    priv->projs1[ org->resno -1 ] = lappend( priv->projs1[ org->resno -1 ], b );

#endif
}

void sp_project_textcat_restrict(
		 psc_private priv,
		 List **ll,
		 FuncExpr *fxpr )
{
    bool topll = false;
    char projkey[ NAMEDATALEN ] = {0};
    char textcat_fld1[ NAMEDATALEN ] = {0};
    char textcat_fld2[ NAMEDATALEN ] = {0};
    List *l = 0;

    const char *fn = get_func_name( fxpr->funcid );
    List *args = fxpr->args;
    bson_t *b = bson_new();

    if(  !*ll )
    {
        topll = true;
    }

    if( args->length == 2 )
    {
        Var *xpr1 = lfirst( args->head );
        Var *xpr2 = lfirst( args->head->next );

        if( IsA( xpr1, Var ) && IsA( xpr2, Var ) )
        {

            Var *v1 = (Var*)xpr1;
            Var *v2 = (Var*)xpr2; 

            sprintf( projkey, "%s_%x", fn, (unsigned int ) (uintptr_t )fxpr->args );

            sprintf( textcat_fld1, "%s", priv->nm[ v1->varattno -1 ].sn );
            sprintf( textcat_fld2, "%s", priv->nm[ v2->varattno -1 ].sn );
        }
        else if( IsA( xpr1, Var ) || IsA( xpr2, Var ) )
        {
        }
        else if( IsA( xpr1, OpExpr ) )
        {
        }
    }

    sp_project_xcat( b, projkey, textcat_fld1, textcat_fld2 );

    if( topll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
        *ll = l;
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}

void sp_project_substr(
		bson_t *b,
		const char *projkey,
		const char* projval,
		int start,
		int len )
{
    int rc = 0;
    bson_t bs;
    bson_t ba;
    char field[ NAMEDATALEN ] = {0};

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, projkey, &bs );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$substr", &ba );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( field, projval, "$") );
    ASSERT_BSON_OK( rc );

    rc = BSON_APPEND_INT32( &ba, "1", start );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_INT32( &ba, "2", len );
    ASSERT_BSON_OK( rc );

    bson_append_array_end( &bs, &ba );
    bson_append_document_end( b, &bs );
}


void sp_project_substr_pattern(
		 bson_t *b,
		 const char *dum_fld,
		  const char* fld,
		 const char* pattern)
{
}

void sp_project_substr_deep(
		psc_private priv,
		TargetEntry * org,
		FuncExpr *fxpr )
{

    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    int start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
    int len= ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue;
    const char *funcname = get_func_name( fxpr->funcid );

    bson_t *b = bson_new();
    Expr *x = lfirst( fxpr->args->head );

    sprintf( projkey, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );

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
            sp_project_coerce_deep( priv, org, cvi );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "%s_%x", funcname, (unsigned int ) (uintptr_t )fx->args );
        sp_project_func_deep( priv, org, fx);
    }

    sp_project_substr( b, projkey, projval, start, len );
    priv->projs1[ org->resno -1 ] = sl_lappend( priv->projs1[ org->resno -1 ], b );
}

void sp_project_substr_restrict(
		 psc_private priv,
		 TargetEntry * org,
		 List **ll,
		 FuncExpr *fxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    const Const * constv =  ( Const * )lfirst( fxpr->args->head->next );
    int start;
    int len;
    const char * pattern = 0;
    const char *funcname = get_func_name( fxpr->funcid );
    List *l = 0;
    bson_t *b = bson_new();
    Expr *x = lfirst( fxpr->args->head );

    if( constv->consttype == TEXTOID )
    {
        pattern = DatumGetCString( constv->constvalue );
        return;
    }
    else
    {
        start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
        len= fxpr->args->head->next->next ?  ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue : -1;
    }


    if( org )
    {
        sprintf( projkey, "pscol%d", org->resno );
    }
    else
    {
        sprintf( projkey, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );
    }

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
            sp_project_coerce_restrict( priv, *ll ? ll : &l, cvi );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "%s_%x", funcname, (unsigned int ) (uintptr_t )fx->args );
        sp_project_func_restrict( priv, 0, *ll ? ll : &l, fx);
    }
    else if( IsA( x, OpExpr ) )
    {
        OpExpr *opxpr = (OpExpr*)x;

        const char* funcname = get_func_name( opxpr->opfuncid );
        sprintf( projval, "%s_%x", funcname, (unsigned int ) (uintptr_t )opxpr->args );
        sp_project_opeartor_restrict( priv, *ll ? ll : &l, opxpr);
    }

    if( pattern )
    {
        sp_project_substr_pattern( b, projkey, projval, pattern );
    }
    else
    {
        sp_project_substr( b, projkey, projval, start, len );
    }

    if( !*ll )
    {
        *ll = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, *ll );
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}

void sp_project_lowerupper(
		bson_t *b,
		const char* outfield,
		const char *fld,
		const char *fn )
{
    int rc = 0;
    bson_t be;

    char field[ NAMEDATALEN ] = {0};

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, outfield, &be );

    ASSERT_BSON_OK( rc );

    if( strcmp( fn, "lower" ) == 0 )
    {
        rc = bson_append_utf8( &be, "$toLower", 8,  sonar_prepend( field, fld, "$" ), -1 );

    }
    if( strcmp( fn, "upper" ) == 0 )
    {
        rc = bson_append_utf8( &be, "$toUpper", 8,  sonar_prepend( field, fld, "$" ), -1 );
    }

    ASSERT_BSON_OK( rc );
    bson_append_document_end( b, &be );

}

void sp_project_lowerupper_deep(
		psc_private priv,
		TargetEntry * org,
		FuncExpr *fxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    const char * funcname = get_func_name( fxpr->funcid );

    bson_t *b = bson_new();
    Expr *x = lfirst( fxpr->args->head );

    sprintf( projkey, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );

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
            sp_project_coerce_deep( priv, org, cvi );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "$%s_%x", funcname, (unsigned int ) (uintptr_t )fx->args );
        sp_project_func_deep( priv, org, fx);
    }

    sp_project_lowerupper( b, projkey, projval, funcname );
    priv->projs1[ org->resno -1 ] = sl_lappend( priv->projs1[ org->resno -1 ], b );
}

void sp_project_lowerupper_restrict(
		 psc_private priv,
		 List **ll,
		 FuncExpr *fxpr )
{

    bool topll = false;
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    const char * funcname = get_func_name( fxpr->funcid );

    List *l = 0;
    bson_t *b = bson_new();
    Expr *x = lfirst( fxpr->args->head );

    if(  !*ll )
    {
        topll = true;
    }

    sprintf( projkey, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );

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
            sp_project_coerce_restrict( priv, topll ?  &l :  ll,  cvi );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "%s_%x", funcname, (unsigned int )(uintptr_t )fx->args );
        sp_project_func_restrict( priv, 0, topll ? &l : ll, fx);
    }

    sp_project_lowerupper( b, projkey, projval, funcname );

    if( topll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }
}


void sp_project_coerce(
		bson_t *b,
		const char *projkey,
		CoerceViaIO *f )
{
}

void sp_project_coerce_deep(
		psc_private priv,
		TargetEntry * org,
		CoerceViaIO *f )
{
}

void sp_project_coerce_restrict(
		 psc_private priv,
		 List **ll,
		 CoerceViaIO *f )
{
}

void sp_project_operator(
		 bson_t *b,
		 const char *key,
		 const OpExpr *f )
{
}

void sp_project_opeartor_deep(
		 psc_private priv,
		 List **ll,
		 const OpExpr *f )
{
}

void sp_project_opeartor_restrict(
		 psc_private priv,
		 List **ll,
		 const OpExpr *opxpr )
{

    bool topll = false;
    char projkey[ NAMEDATALEN ] = {0};
    char concat_fld1[ NAMEDATALEN ] = {0};
    char concat_fld2[ NAMEDATALEN ] = {0};
    const char * funcname = get_func_name( opxpr->opfuncid );
    List *l = 0;

    bson_t *b = bson_new();


    if(  !ll )
    {
        topll = true;
    }

    if( strcmp( funcname, "textcat" ) == 0 )
    {
        List *args = opxpr->args;

        if( args->length == 2 )
        {
            Var *xpr1 = lfirst( args->head );
            Var *xpr2 = lfirst( args->head->next );

            if( IsA( xpr1, Var ) && IsA( xpr2, Var ) )
            {

                Var *v1 = (Var*)xpr1;
                Var *v2 = (Var*)xpr2; 
                //bson_t *b = bson_new();

                sprintf( projkey, "%s_%x", funcname, ( unsigned int )( uintptr_t )opxpr->args );

                sprintf( concat_fld1, "%s", priv->nm[ v1->varattno -1 ].sn );
                sprintf( concat_fld2, "%s", priv->nm[ v2->varattno -1 ].sn );
            }
            else if( IsA( xpr1, OpExpr ) )
            {
            }
        }
    }

    sp_project_xcat( b, projkey, concat_fld1, concat_fld2 );

    if( topll )
    {
        l = sl_lappend( l, b );
        priv->projs = sl_lappend( priv->projs, l );
    }
    else
    {
        *ll = sl_lappend( *ll, b );
    }

#if 0
    if( IsA( x, Var ) )
    {
        bson_t firstb;

        Var *v = ( Var * )x;
        sprintf( projval, "%s", priv->nm[ v->varattno - 1].sn );
    }
    else if( IsA( x, CoerceViaIO ) )
    {
       CoerceViaIO *cvi = (CoerceViaIO*)x;

       if( cvi->coerceformat == COERCE_EXPLICIT_CAST )
       {
           Expr *axpr = cvi->arg;

            sprintf( projval, "%s_%x", "coerce", cvi->arg );
            sp_project_coerce_restrict( priv, topll ?  &l :  ll, cvi );
       }
    }
    else if( IsA( x, FuncExpr ) )
    {
        FuncExpr *fx = (FuncExpr*) x;
        const char* funcname = get_func_name( fx->funcid );

        sprintf( projval, "$%s_%x", funcname, fx->args );
        sp_project_func_restrict( priv, topll ? &l : ll, x);
    }

    sp_project_lowerupper( b, projkey, projval, funcname );

    if( topll )
    {
        l = lappend( l, b );
        priv->projs = lappend( priv->projs, l );
    }
    else
    {
        *ll = lappend( *ll, b );
    }
#endif
}

void sp_project_math_var_var(
		 psc_private priv,
		 bson_t *b,
		 const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char operand_fld1[ NAMEDATALEN ] = {0};
    char operand_fld2[ NAMEDATALEN ] = {0};

	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char *fn = get_func_name( opxpr->opfuncid );


    Var *v1 = lfirst( opxpr->args->head );
    Var *v2 = lfirst( opxpr->args->head->next );

    sprintf( projkey, "%s_%x", fn, (unsigned int)(uintptr_t ) opxpr->args);

    sprintf( operand_fld1, "$%s", priv->nm[ v1->varattno -1 ].sn );
    sprintf( operand_fld2, "$%s", priv->nm[ v2->varattno -1 ].sn );
    sp_project_math( b, projkey, opid,  operand_fld1, operand_fld2 );
}

void sp_project_math_var_const(
		 psc_private priv,
		 bson_t *b,
		 const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char operand_fld1[ NAMEDATALEN ] = {0};

	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char *fn = get_func_name( opxpr->opfuncid );

    const Var *v = lfirst( opxpr->args->head );
    const Const *c = lfirst( opxpr->args->head->next );

    sprintf( projkey, "%s_%x", fn, (unsigned int)(uintptr_t ) opxpr->args);

    sprintf( operand_fld1, "$%s", priv->nm[ v->varattno -1 ].sn );
    sp_project_math_vconst( b, projkey, opid,  operand_fld1,  c );
}

void sp_project_math_const_var(
		 psc_private priv,
		 bson_t *b,
		 const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char operand_fld1[ NAMEDATALEN ] = {0};

	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char *fn = get_func_name( opxpr->opfuncid );

    const Const *c = lfirst( opxpr->args->head );
    const Var *v = lfirst( opxpr->args->head->next );

    sprintf( projkey, "%s_%x", fn, (unsigned int)(uintptr_t ) opxpr->args);

    sprintf( operand_fld1, "$%s", priv->nm[ v->varattno -1 ].sn );
    sp_project_math_vconst( b, projkey, opid,  operand_fld1,  c );
}

void sp_project_math_opxpr_const(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char operand_fld1[ NAMEDATALEN ] = {0};

	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char *fn = get_func_name( opxpr->opfuncid );

    const OpExpr *xpr =  lfirst( opxpr->args->head );
    const Const *c  = lfirst( opxpr->args->head->next );

    const char *subfn = get_func_name( xpr->opfuncid );

    sp_project_math_restrict( priv, ll, xpr );
    

    sprintf( projkey, "%s_%x", fn, (unsigned int)(uintptr_t ) opxpr->args);
    sprintf( operand_fld1, "$%s_%x", subfn, (unsigned int)(uintptr_t ) xpr->args);
    sp_project_math_vconst( b, projkey, opid, operand_fld1, c );
}

void sp_project_math_const_opxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char operand_fld2[ NAMEDATALEN ] = {0};

	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char *fn = get_func_name( opxpr->opfuncid );

    const Const *c  =  lfirst( opxpr->args->head );
    const OpExpr *xpr = lfirst( opxpr->args->head->next );

    const char *subfn = get_func_name( xpr->opfuncid );

    sp_project_math_restrict( priv, ll, xpr );
    

    sprintf( projkey, "%s_%x", fn, (unsigned int)(uintptr_t ) opxpr->args);
    sprintf( operand_fld2, "$%s_%x", subfn, (unsigned int)(uintptr_t ) xpr->args);
    sp_project_math_constv( b, projkey, opid, c, operand_fld2 );
}

void sp_project_math_opxpr_var(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr )
{
    char projkey[ NAMEDATALEN ] = {0};
    char operand_fld1[ NAMEDATALEN ] = {0};
    char operand_fld2[ NAMEDATALEN ] = {0};

	const char * op_name = get_opname( opxpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char *fn = get_func_name( opxpr->opfuncid );

    const OpExpr *xpr =  lfirst( opxpr->args->head );
    const Var *v = lfirst( opxpr->args->head->next );

    const char *subfn = get_func_name( xpr->opfuncid );

    sp_project_math_restrict( priv, ll, xpr );
    

    sprintf( projkey, "%s_%x", fn, (unsigned int)(uintptr_t ) opxpr->args);
    sprintf( operand_fld1, "$%s_%x", subfn, (unsigned int)(uintptr_t ) xpr->args);
    sprintf( operand_fld2, "$%s", priv->nm[ v->varattno -1 ].sn );
    sp_project_math( b, projkey, opid,  operand_fld1, operand_fld2 );
}

void sp_project_math_var_opxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr )
{
}


void sp_project_opcat_opxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const OpExpr *opxpr )
{
    int rc = 0;
    bool topll = false;
    char projval[ NAMEDATALEN ] = {0};
    char concat_fld[ NAMEDATALEN ] = {0};
    const char *idx;
    ListCell *c;

    const char *fn = get_func_name( opxpr->opfuncid );
    List *args = opxpr->args;

    foreach( c, args )
    {
        Expr *xpr = lfirst( c );
        if( IsA( xpr, Var ) )
        {
            Var* v = ( Var*) xpr;
            idx = array_index( au );
            rc = BSON_APPEND_UTF8( b, idx, sonar_prepend( concat_fld, priv->nm[ v->varattno -1].sn, "$") );
            ASSERT_BSON_OK( rc );
        }
        else if( IsA( xpr, Const ) )
        {
            Const* c = ( Const*) xpr;
            const char *cv = ((text*)DatumGetTextP( c->constvalue ))->vl_dat;
            idx = array_index( au );
            rc = BSON_APPEND_UTF8( b, idx, cv );
        }
        else if( IsA( xpr, OpExpr ) )
        {
            sp_project_opcat_opxpr( priv, ll, b, au, (OpExpr*) xpr );
        }
        else if( IsA( xpr, FuncExpr ) )
        {
            sp_project_opcat_fxpr( priv, ll, b, au, (FuncExpr*)xpr );
        }
        else
        {
            //should cover all types now
        }
    }
}

void sp_project_opcat_fxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr )
{
    int rc = 0;
    const char * funcname = get_func_name( fxpr->funcid );

    if( strcmp( funcname, "substring" ) == 0 ||  strcmp( funcname, "substr" ) == 0  ) 
    {
        sp_project_opcat_substr( priv, ll, b, au, fxpr );
    }
    else if( strcmp( funcname, "lower" ) == 0 || strcmp( funcname, "upper" ) == 0 )
    {
        sp_project_opcat_lowerupper( priv, ll, b, au, fxpr );

    }
    else if( strcmp( funcname, "textcat" ) == 0 )
    {
        sp_project_opcat_strcat( priv, ll, b, au, fxpr );
    }
    else
    {
        char projval[ NAMEDATALEN ] = {0};
        const char *idx  = array_index( au );
        char field[ NAMEDATALEN ] = {0};
        sprintf( projval, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );
        sp_project_func_restrict( priv, 0, ll, fxpr);
        rc = BSON_APPEND_UTF8( b,  idx, sonar_prepend( field, projval, "$" ) );
        ASSERT_BSON_OK( rc );

    }
}




void sp_project_opcat_substr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr )
{
    int rc = 0;
    const char *idx  = array_index( au );
    bson_t bd;
    bson_t ba;
    char projkey[ NAMEDATALEN ] = {0};
    char projval[ NAMEDATALEN ] = {0};
    char field[ NAMEDATALEN ] = {0};
    const Const * constv =  ( Const * )lfirst( fxpr->args->head->next );
    int start;
    int len;
    const char * pattern = 0;
    const char *funcname = get_func_name( fxpr->funcid );
    List *l = 0;
    Expr *x = lfirst( fxpr->args->head );

    if( constv->consttype == TEXTOID )
    {
        pattern = DatumGetCString( constv->constvalue );
        return;
    }
    else
    {
        start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
        len= fxpr->args->head->next->next ?  ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue : -1;
    }

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, idx, &bd );
    rc = BSON_APPEND_ARRAY_BEGIN( &bd, "$substr", &ba );
    ASSERT_BSON_OK( rc );
    if( IsA( x, Var ) )
    {
        Var *vx = (Var*)x;
        sprintf( projval, "$%s", priv->nm[ vx->varattno -1 ] .sn );
        rc = BSON_APPEND_UTF8( &ba, "0", projval );
    }
    else if( IsA( x, Const ) )
    {
        Const* c = ( Const*) x;
        const char *cv = ((text*)DatumGetTextP( c->constvalue ))->vl_dat;
        rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( field, cv, "$") );
    }
    else if( IsA( x, FuncExpr ) )
    {
        sprintf( projval, "%s_%x", funcname, (unsigned int ) (uintptr_t )fxpr->args );
        rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( field, projval, "$") );
        sp_project_func_restrict( priv, 0, ll, (FuncExpr*) x);
    }

    rc = BSON_APPEND_INT32( &ba, "1", start );
    ASSERT_BSON_OK( rc );
    rc = BSON_APPEND_INT32( &ba, "2", len );
    ASSERT_BSON_OK( rc );

    bson_append_array_end( &bd, &ba );
    bson_append_document_end( b, &bd );

}


void sp_project_opcat_lowerupper(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr )
{
    #if 0
    rc = BSON_APPEND_DOCUMENT_BEGIN( b, idx, &fb );
    ASSERT_BSON_OK( rc );
    sp_project_opcat_fxpr( priv, ll, b, (FuncExpr*)xpr );
    bson_append_document_end( b, &fb );
#endif
}


void sp_project_opcat_strcat(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr )
{
}

