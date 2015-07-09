/* * sonar_restrict_expr.c * 
 * implements SQL where clause conversion to mongo type query 
 * Author : CUI, SHU HIA 
 * Mon Apr 28 16:16:45 PDT 2014  
 */ 

#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_list.h"
#include "sonar_bson.h"
#include "sonar_join.h"
#include "sonar_subquery.h"
#include "sonar_project.h"
#include "sonar_outstretch.h"
#include "sonar_restriction.h"

static
void sr_init_subquery(psc_private priv,
                      psc_private inpriv,
                      bson_t *b ,
                      Var *ov );
 /* //XXX this works, so can be used for huge query  with fields compring  - REMOVE after implementatin

 db.flightsfixed9b.find(  {  $or:  [  "taxiin" : 10,  $where : "'taxiin' <  'taxiout'" ] } , { taxiin : 1 })
 */
pgsn_operator_map OpMap[] = {
	{ SONA_LE, "<=", "$lte" },
	{ SONA_LT, "<", "$lt" },
	{ SONA_GT, ">", "$gt" },
	{ SONA_GE, ">=", "$gte" },
	{ SONA_EQ, "=", "$eq" },
	{ SONA_NE, "<>", "$ne" },
	{ SONA_IN, "in", "$in" },   
	{ SONA_ALL, "@>", "$all" },   
	{ SONA_RALL, "<@", "$all" },   
	{ SONA_BN, "<->", "$bn" },
	{ SONA_RX, "~~", "$regex" },			/* match like */
	{ SONA_IRX, "~~*", "$regex" },			/* match like */
	{ SONA_NRX, "!~~", "$regex" },			/* not match like */
	{ SONA_NRX, "!~~*", "$regex" },			/* not match like */
	{ SONA_NT, "NullTest", "$exist" }, 	/* null test */
	{ SONA_SA, "~=", "$sa" },			/* same as */
	{ SONA_MDO, "%", "$mod" },			/* modulos*/
	{ SONA_MT, "~", "$mt" },			/* match case insensitive*/
	{ SONA_NM, "!~", "$nm" },			/* not match case insensitive*/
	{ SONA_ADD, "+", "$add" },			/* not match case insensitive*/
	{ SONA_SUB, "-", "$subtract" },			/* not match case insensitive*/
	{ SONA_MUL, "*", "$multiply" },			/* not match case insensitive*/
	{ SONA_DIV, "/", "$divide" },			/* not match case insensitive*/
	{ SONA_CAT, "||", "$concat" },			/* not match case insensitive*/
 	{ SONA_LAST , NULL, NULL }
};


int
sr_opexpr_1( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{
    return true;
}


int
sr_opexpr_var_const( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{
    int rc = 0;

    OpExpr *opexpr = (OpExpr *) expr;
    const char * op_name = get_opname( opexpr->opno );
    char col_name[ NAMEDATALEN ] = {0};
    const Var *v;
    const Const *c;

    Expr *xr1  =  ( Expr * ) opexpr->args->head->data.ptr_value;
    Expr *xr2  = ( Expr * ) opexpr->args->head->next->data.ptr_value;

    snop_id opid = su_sop_from_pg( op_name );

    sr_opexpr_vc( xr1, xr2, &v, &c );

    sr_operator_field( priv, v, col_name, where );

    if( priv->t == query_group )
        sp_project_var_restrict( priv, ll, v );
     
    if( opid == SONA_EQ )
    {
        sb_append_eq( b, col_name, c );
    }
    else if( opid == SONA_NRX )
    {
        sb_append_nx( b, expr, col_name, false );
    }
    else if( opid == SONA_INRX )
    {
        sb_append_nx( b, expr, col_name, true );
    }
    else
    {
        bson_t sbd;
        // start a new objet for each new expression
        BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );

        sb_append_wild( &sbd, opid, expr, c );
        if( !in_array )
        {
            sr_dup_fld_expr( priv, &sbd, exprs, expr, col_name, where );
        }

        // finish bson_t object
        rc = bson_append_document_end( b, &sbd );
        ASSERT_BSON_OK(rc);
    }
}

int
sr_opexpr_var_var( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{
    int rc = 0;

    OpExpr *opexpr = (OpExpr *) expr;
    const char * op_name = get_opname( opexpr->opno );
    //char col_name[ NAMEDATALEN ] = {0};

    Expr *xr1  =  ( Expr * ) opexpr->args->head->data.ptr_value;
    Expr *xr2  = ( Expr * ) opexpr->args->head->next->data.ptr_value;
    const Var *v1 = ( Var * )xr1;
    const Var *v2 = ( Var * )xr2;
    char name[ NAMEDATALEN ] = {0};
    char cn[ NAMEDATALEN ] = {0};
    const char * cn1 = priv->nm[ v1->varattno - 1].sn ;
    const char * cn2 = priv->nm[ v2->varattno - 1].sn ;

    snop_id opid = su_sop_from_pg( op_name );

    //XXX join is not processed here
    if( v1->varno != v2->varno )
        return rc;

    if( use_agg )
    {
        bson_t bs;
        bson_t ba;
         sprintf( name, "%s_%s", priv->nm[ v1->varattno -1 ].pn, priv->nm[ v2->varattno -1 ].pn );

         if( strcmp( op_name, "=" ) == 0 )
         {
             rc = BSON_APPEND_INT32( b, name, 0 );

         }
         else if( strcmp( op_name, ">" ) == 0 )
         {
             rc = BSON_APPEND_INT32( b, name, 1 );

         }
         else if( strcmp( op_name, "<" ) == 0 )
         {
             rc = BSON_APPEND_INT32( b, name, -1 );

         }
         else if( strcmp( op_name, "<=" ) == 0 )
         {
             bson_t orb;
             bson_t or1;
             bson_t or0;

             rc = BSON_APPEND_ARRAY_BEGIN( b, "$or", &orb );

             rc = BSON_APPEND_DOCUMENT_BEGIN( &orb, "0", &or0 );
             rc = BSON_APPEND_INT32( &or0, name, 0 );
             bson_append_document_end( &orb, &or0);

             rc = BSON_APPEND_DOCUMENT_BEGIN( &orb, "1", &or1 );
             rc = BSON_APPEND_INT32( &or1, name, -1 );
             bson_append_document_end( &orb, &or1);

             bson_append_array_end( b, &orb );

         }
         else if( strcmp( op_name, ">=" ) == 0 )
         {
             bson_t orb;
             bson_t or1;
             bson_t or0;

             rc = BSON_APPEND_ARRAY_BEGIN( b, "$or", &orb );

             rc = BSON_APPEND_DOCUMENT_BEGIN( &orb, "0", &or0 );
             rc = BSON_APPEND_INT32( &or0, name, 0 );
             bson_append_document_end( &orb, &or0);

             rc = BSON_APPEND_DOCUMENT_BEGIN( &orb, "1", &or1 );
             rc = BSON_APPEND_INT32( &or1, name, 1 );
             bson_append_document_end( &orb, &or1);

             bson_append_array_end( b, &orb );
         }

         rc = BSON_APPEND_DOCUMENT_BEGIN( priv->f, name, &bs );
         rc = BSON_APPEND_ARRAY_BEGIN( &bs, "$cmp", &ba );
         rc = BSON_APPEND_UTF8( &ba, "0", sonar_prepend( cn, cn1, "$" ) );
         memset( cn, 0, NAMEDATALEN );
         rc = BSON_APPEND_UTF8( &ba, "1", sonar_prepend( cn, cn2, "$" ) );

         bson_append_array_end( &bs, &ba );
         bson_append_document_end( priv->f, &bs );

    }
    else
    {
        //XXX may be mor complicate, then expanding OpMap

        sprintf( name, "'%s' %s '%s'", cn1, OpMap[ opid ].pg_op, cn2 );
        rc = BSON_APPEND_UTF8( b, "$where", name );
    }
}


int
sr_opexpr_aggref_const( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{
    int rc = 0;

    OpExpr *opexpr = (OpExpr *) expr;
    const char * op_name = get_opname( opexpr->opno );
    char col_name[ NAMEDATALEN ] = {0};

    Expr *xr1  =  ( Expr * ) opexpr->args->head->data.ptr_value;
    Expr *xr2  = ( Expr * ) opexpr->args->head->next->data.ptr_value;
    char coin_alias[ 16 ] = {0};
    Aggref *ag = (Aggref *) xr1;
    Const *c = (Const *) xr2;
    //char * agg_func_name = get_func_name( ag->aggfnoid );
    TargetEntry* tlea; 

    snop_id opid = su_sop_from_pg( op_name );
    tlea = sonar_get_alias( priv->L, ag );
    if( tlea )
    {

        sprintf( coin_alias, "pscol%d", tlea->resno );

        if( opid == SONA_EQ )
        {
            sb_append_eq( b, coin_alias, c );
        }
        else if( opid == SONA_NRX )
        {
            sb_append_nx( b, expr, coin_alias, false );
        }
        else if( opid == SONA_INRX )
        {
            sb_append_nx( b, expr, coin_alias, true );
        }
        else 
        {
            bson_t sbd;
            // start a new objet for each new expression
            rc = BSON_APPEND_DOCUMENT_BEGIN( b, coin_alias, &sbd );
            ASSERT_BSON_OK(rc);

            sb_append_wild( &sbd, opid, expr, c );

            if( !in_array )
            {
                sr_dup_fld_expr( priv, &sbd, exprs, expr, coin_alias, where );
            }
            rc = bson_append_document_end( b, &sbd );
            ASSERT_BSON_OK(rc);
        }
        // finish bson_t object
    }
}

int
sr_opexpr_func_const( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{
    int rc = 0;

    OpExpr *opexpr = (OpExpr *) expr;
    const char * op_name = get_opname( opexpr->opno );
    char col_name[ NAMEDATALEN ] = {0};

    FuncExpr *fcexpr = (FuncExpr *) opexpr->args->head->data.ptr_value;
    Const *c = (Const *) opexpr->args->head->next->data.ptr_value;

    snop_id opid = su_sop_from_pg( op_name );

    if( sm_is_xfunc( fcexpr ) )
    {
        sr_trueexpr( priv, exprs, b, in_array, au, expr, 0, where);
        //should be always true;
    }
    else if( fcexpr->funcformat == COERCE_EXPLICIT_CALL )
    {
        const char *funcname = get_func_name( fcexpr->funcid );

        if(  strcmp( funcname, "substring" ) == 0 || strcmp( funcname, "substr" ) == 0 ) 
        {
            char substr_fld[ NAMEDATALEN ] = {0};
            if( fcexpr->args->length == 3  ||  fcexpr->args->length == 2  )
            {
                //Expr *expr = lfirst( fcexpr->args->head );

                sprintf( substr_fld, "%s_%x", funcname, (unsigned int)(uintptr_t )fcexpr->args );

                priv->where_map_flag = true;
                sp_project_func_restrict( priv, 0, ll, fcexpr );

                if( opid == SONA_NRX )
                {
                    sb_append_nx( b, expr, substr_fld, false );
                }
                if( opid == SONA_INRX )
                {
                    sb_append_nx( b, expr, substr_fld, true );
                }
                else
                    sr_bson_append_via_op( b, opid, substr_fld, c );

            }
        }
        else if(  strcmp( funcname, "concat" ) == 0 ) 
        {
            char concat_fld[ NAMEDATALEN ] = {0};
            sprintf( concat_fld, "%s_%x", funcname, (unsigned int)(uintptr_t )fcexpr->args );
            sp_project_concat_restrict( priv, ll, fcexpr );

            if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, concat_fld ,  false);
            }
            if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, concat_fld , true);
            }
            else
                sr_bson_append_via_op( b, opid, concat_fld, c );
        }
        else if(  strcmp( funcname, "concat_ws" ) == 0 ) 
        {
            char concat_fld[ NAMEDATALEN ] = {0};
            sprintf( concat_fld, "%s_%x", funcname, (unsigned int)(uintptr_t )fcexpr->args );
            sp_project_concatws_restrict( priv, ll, fcexpr );

            if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, concat_fld ,  false);
            }
            if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, concat_fld , true);
            }
            else
                sr_bson_append_via_op( b, opid, concat_fld, c );
        }
        else if(  strcmp( funcname, "textcat" ) == 0 ) 
        {
            char textcat_fld[ NAMEDATALEN ] = {0};
            sprintf( textcat_fld, "%s_%x", funcname, (unsigned int)(uintptr_t )fcexpr->args );
            sp_project_textcat_restrict( priv, ll, fcexpr );

            if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, textcat_fld ,  false);
            }
            if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, textcat_fld , true);
            }
            else
                sr_bson_append_via_op( b, opid, textcat_fld, c );
        }
        else if(  strcmp( funcname, "lower" ) == 0 ) 
        {
            char lower_fld[ NAMEDATALEN ] = {0};
            sprintf( lower_fld, "%s_%x", funcname, (unsigned int)(uintptr_t )fcexpr->args );
            sp_project_lowerupper_restrict( priv, ll, fcexpr );

            if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, lower_fld ,  false);
            }
            if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, lower_fld , true);
            }
            else
                sr_bson_append_via_op( b, opid, lower_fld, c );
        }
        else if(  strcmp( funcname, "upper" ) == 0 ) 
        {
            char upper_fld[ NAMEDATALEN ] = {0};
            sprintf( upper_fld, "%s_%x", funcname, (unsigned int)(uintptr_t )fcexpr->args );
            sp_project_lowerupper_restrict( priv, ll, fcexpr );

            if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, upper_fld ,  false);
            }
            if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, upper_fld , true);
            }
            else
                sr_bson_append_via_op( b, opid, upper_fld, c );
        }
    }
    else if( fcexpr->funcformat == COERCE_IMPLICIT_CAST && fcexpr->args->length == 1 )
    {
        Expr *x = lfirst( fcexpr->args->head );
        
        if( IsA( x, Var ) )
        {
            const Var *v = ( Var * )x;

            sprintf( col_name, "%s",  priv->nm[ v->varattno - 1].sn);
             
            if( opid == SONA_EQ )
            {
                sb_append_eq( b, col_name, c );
            }
            else if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, col_name ,  false);
            }
            else if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, col_name , true);
            }
            else
            {
                bson_t sbd;
                // start a new objet for each new expression
                rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
                ASSERT_BSON_OK(rc);

                sb_append_wild( &sbd, opid, expr, c );

                if( !in_array )
                {
                    sr_dup_fld_expr( priv, &sbd, exprs, expr, col_name, where );
                }
                
                // finish bson_t object
                rc = bson_append_document_end( b, &sbd );
                ASSERT_BSON_OK(rc);
            }
        }
        else if( IsA( x, Aggref ) )
        {
            char coin_alias[ 16 ] = {0};
            Aggref *ag = (Aggref*) x;
            TargetEntry* tlea = sonar_get_alias( priv->L, ag );
            bson_t sbd;

            sprintf( coin_alias, "pscol%d", tlea->resno );

            if( opid == SONA_EQ )
            {
                sb_append_eq( b, coin_alias, c );
            }
            else if( opid == SONA_NRX )
            {
                sb_append_nx( b, expr, coin_alias ,  false);
            }
            else if( opid == SONA_INRX )
            {
                sb_append_nx( b, expr, coin_alias , true);
            }
            else
            {
                bson_t sbd;
                // start a new objet for each new expression
                BSON_APPEND_DOCUMENT_BEGIN( b, coin_alias, &sbd );

                sb_append_wild( &sbd, opid, expr, c );
                if( !in_array )
                {
                    sr_dup_fld_expr( priv, &sbd, exprs, expr, coin_alias, where );
                }

                // finish bson_t object
                rc = bson_append_document_end( b, &sbd );
                ASSERT_BSON_OK(rc);
            }
        }
    }
}


int
sr_opexpr_opexpr_const( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{
}

int
sr_opexpr_2( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{

    int rc = 0;

    OpExpr *opexpr = (OpExpr *) expr;
    const char * op_name = get_opname( opexpr->opno );
    char col_name[ NAMEDATALEN ] = {0};

    Expr *xr1  =  ( Expr * ) opexpr->args->head->data.ptr_value;
    Expr *xr2  = ( Expr * ) opexpr->args->head->next->data.ptr_value;

    snop_id opid = su_sop_from_pg( op_name );

    if( ( IsA( xr2, Var )  && IsA( xr1, Const )) ||  (IsA( xr1, Var )  && IsA( xr2, Const )) )
    {

        sr_opexpr_var_const( priv, exprs, b, in_array, au, expr, use_agg, ll, where );
    }
    else if( IsA( xr1, Var) && IsA( xr2, Var )  )
    {
        sr_opexpr_var_var( priv, exprs, b, in_array, au, expr, use_agg, ll, where );
    }
    else if( IsA( xr1, Aggref ) && IsA( xr2, Const ) )
    {
        sr_opexpr_aggref_const( priv, exprs, b, in_array, au, expr, use_agg, ll, where );
    }
    else if( IsA( xr1, FuncExpr) && IsA( xr2, Const ) )
    {
        sr_opexpr_func_const( priv, exprs, b, in_array, au, expr, use_agg, ll, where );

    }
    else if( IsA( xr1, OpExpr) && IsA( xr2, Const ) )
    {
        if( sm_opxpr_has_xfunc( (OpExpr *) xr1 ) )
        {
            sr_trueexpr( priv, exprs, b, in_array, au, expr, 0, where);
        }
        else
        {
            List *topll = 0;
            sr_opexpr2( priv, exprs, b, in_array, au, expr, use_agg, &topll , where);
        }

    }
    else if( IsA( xr1, Param ) && IsA( xr2, Const ) ) // join local table
    {
        //Param *param = (Param*)xr1;
        //Const *cnst = (Const*) xr2;
        //processed at rescan & as separate restriction

    }
    else if( IsA( xr1, ArrayRef )  && IsA( xr2, Const ) )
    {
        ArrayRef *aref = (ArrayRef*)xr1;
        //Const *c = (Const *) xr2;
        Expr *expr = aref->refexpr;
        if( IsA( expr, Var ) )
        {
        }
    }
    else // we do not support complex stuff, so the value should be true or false
    {
    }
	return rc;
}
/** build bson_t object for restrict info list
 * @ exprs - expressions either bool or operator
 * @ b - bson_t object container
 * @return result bson_t object
*/
 

int
sr_opexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
         List **ll ,
		 bool where)
{
    OpExpr *opexpr = (OpExpr *) expr;

    if( opexpr->args->length == 1 )
        return sr_opexpr_1( priv, exprs, b, in_array, au, expr, use_agg, ll, where );
    else //( opexpr->args->length == 2 )
        return sr_opexpr_2( priv, exprs, b, in_array, au, expr, use_agg, ll, where );
}


int
sr_opexpr2( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll ,
		 bool where)
{

	int rc = false;

	OpExpr *opexpr = (OpExpr *) expr;
    OpExpr *x  =  ( OpExpr * ) opexpr->args->head->data.ptr_value;
    Const *c  = ( Const* ) opexpr->args->head->next->data.ptr_value;
	const char * op_name = get_opname( opexpr->opno );
	snop_id opid = su_sop_from_pg( op_name );
    const char * op_name1 = get_opname( x->opno );
    snop_id opid1 = su_sop_from_pg( op_name1 );

    Expr *xpr1 =  ( Expr * ) x->args->head->data.ptr_value;
    Expr *xpr2 =  ( Expr * ) x->args->head->next->data.ptr_value;



    if( opid1 == SONA_MDO && IsA( xpr2, Const ) )
    {
        const Const *d = (Const *) xpr2;

        if( IsA( xpr1, FuncExpr ) )
        {
            const FuncExpr *fx = (FuncExpr*) xpr1;

            if( fx->funcformat == COERCE_EXPLICIT_CAST && fx->args->length == 1 )
            {

                Expr *vx = lfirst( fx->args->head );

                if( IsA( vx, Var ) )
                {
                    const Var *v = (Var*) vx;
                    const char* col_name = priv->nm[ v->varattno - 1].sn;

                    if(  opid == SONA_EQ )
                    {
                        bson_t sbd;
                        rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
                        ASSERT_BSON_OK(rc);

                        sb_append_md( &sbd, d, c );

                        rc = bson_append_document_end( b, &sbd );
                        ASSERT_BSON_OK(rc);
                    }
                }
            }
        }
        else if( IsA( xpr1, Var ) )
        {
            bson_t sbd;
            const Var *v = (Var*) xpr1;
            const char* col_name = priv->nm[ v->varattno - 1].sn;

            rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            ASSERT_BSON_OK(rc);

            sb_append_md( &sbd, d, c );

            rc = bson_append_document_end( b, &sbd );
            ASSERT_BSON_OK(rc);
        }
    }
    else IF_MATH_OPERATOR( opid1  )
    {
        char prjkey[ NAMEDATALEN ] = {0};
        const char *fn = get_func_name( x->opfuncid );

        sprintf( prjkey, "%s_%x", fn, (unsigned int)(uintptr_t ) x->args );
        
        sp_project_math_restrict( priv, ll, x );

        //regex won't happen here
        sr_bson_append_via_op( b, opid, prjkey, c );
    }
    if( opid1 == SONA_CAT )
    {
        char prjkey[ NAMEDATALEN ] = {0};
        const char *fn = get_func_name( x->opfuncid );

        sprintf( prjkey, "%s_%x", fn, (unsigned int)(uintptr_t ) x->args );
        
        sp_project_opcat_restrict( priv, ll, x );

        if( opid == SONA_NRX )
        {
            sb_append_nx( b, expr, prjkey ,  false);
        }
        if( opid == SONA_INRX )
        {
            sb_append_nx( b, expr, prjkey , true);
        }
        else
            sr_bson_append_via_op( b, opid, prjkey, c );
    }

	return rc;
}


int
sr_subplan_expr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    int rc = 0;

    PlannerInfo *root = priv->root;

    if( root->parse->hasSubLinks )
    {
        SubPlan *sp = (SubPlan*) expr;

        if( sp->subLinkType == ANY_SUBLINK )
        {
            sr_subplan_anysublink( priv, exprs, b, in_array, au, expr, use_agg, ll );
        }
        else if( sp->subLinkType != EXISTS_SUBLINK )
        {
            sr_subplan_nonexist( priv, exprs, b, in_array, au, expr, use_agg, ll );
        }
        else
        {
            List *nel;
            if( ss_is_outquery( priv->root, priv->baserel, priv ) )
            {
                PlannerInfo *root = priv->root;
                List *l = root->glob->subroots;
                ListCell *c;
                //sx_outer_query( root, baserel, priv, "", "", 0 );

                foreach( c, l )
                {
                    //subroot
                    PlannerInfo *rt = (PlannerInfo*) lfirst( c );
                    List *rtable = rt->parse->rtable;

                    if( rt->parse->jointree )
                    {
                        FromExpr *fxr = rt->parse->jointree;
                        List *fromlist = fxr->fromlist;
                        List *quals = (List*)fxr->quals;

                        ListCell *from;
                        ListCell *qual;

                        foreach( from, fromlist )
                        {
                            Expr *rxpr = lfirst( from );
                            if( IsA( rxpr, RangeTblRef ) )
                            {
                                //RangeTblRef *rtr = ( RangeTblRef * )rxpr;

                                //RelOptInfo *rel = rt->simple_rel_array[ rtr->rtindex ];
                                //XXX right now, only process one table entry...
                                RangeTblEntry *rte = lfirst( rtable->head );

                                if( rte->rtekind == RTE_FUNCTION && rte->relid == 0 )
                                {
                                    ListCell *function;
                                    
                                    foreach( function, rte->functions )
                                    {
                                        RangeTblFunction *rtf = (RangeTblFunction*)lfirst( function );
                                        Node *nd = rtf->funcexpr;
                                        if( nd->type == T_FuncExpr )
                                        {
                                            FuncExpr *funcExpr = (FuncExpr*) nd;
                                            if( strcmp( get_func_name( funcExpr->funcid ), "json_array_elements_text") == 0 )
                                            {
                                                if( sp->args && sp->args->length == 1)
                                                {
                                                    Expr *expr = lfirst( sp->args->head );
                                                    if( IsA( expr, Var ) )
                                                    {
                                                        //Var *v = (Var *)expr;
                                                        //const char *fld = priv->nm[ v->varattno -1].sn;
                                                        //rc = bson_append_regex( b, fld, strlen( "fld" ), ".*URI.*", "i" );

                                                    }
                                                }
                                            }
                                        }
                                    }

                                }

                                foreach( qual, quals )
                                {
                                    Expr *x = ( Expr*) lfirst( qual );

                                    if( IsA( x, OpExpr ) )
                                    {
                                        //OpExpr *oxpr = (OpExpr *) x;
                                        //List *args = oxpr->args;

                                    }
                                }
                            }
                        }
                    }
                }

            }

            nel = sp->args;

            if( nel->length == 1 )
            {
                Expr *xpr = lfirst( nel->head );
                if( IsA( xpr, Var ) )
                {
                    //Var *v = (Var*)xpr;
                }
                else
                {
                }
            }

        }
    }
	return rc;
}


/** implemets $in $nin, ANY, ALL queries here 
*/
int
sr_arrayexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr * expr,
		 List **ll ,
		 bool where)
{

	int rc = false;

	ScalarArrayOpExpr * arrexpr = (ScalarArrayOpExpr*) expr;

    Expr *x1 = ( Expr*) lfirst( arrexpr->args->head );
    Expr *x2 = ( Expr*) lfirst( arrexpr->args->head->next );
	const char * op_name = get_opname( arrexpr->opno );
	snop_id opid = su_sop_from_pg( op_name );

    if( IsA( x1, Var ) && IsA( x2, Const ) )
    {
        bson_t sbd;
        Var *v = (Var*) x1;

        Const *c = (Const *)x2;

        const char * col_name = priv->nm[ v->varattno - 1].sn ;

        // ANY
        if( strcmp( op_name, OpMap [ SONA_NE ].pg_op  ) == 0 )
        {
            BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            sb_append_in( &sbd, expr );
            bson_append_document_end( b, &sbd );
        }
        else if( strcmp( op_name, OpMap [ SONA_EQ ].pg_op  ) == 0 ) //usrOr == 0
        {
            if( arrexpr->useOr )
            {
                BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
                sb_append_in( &sbd, expr );
                bson_append_document_end( b , &sbd );
            }
            else
                sb_append_arr_eq( b, col_name, c );
        }
        else
        {
            // start a new objet for each new expression
            rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            ASSERT_BSON_OK(rc);
        
            switch( opid )
            {
                case  SONA_LE:
                case  SONA_LT:
                case  SONA_GT:
                case  SONA_GE:
                case  SONA_EQ:
                case  SONA_NE:
                //	sb_append_xx( b, opid, c );
                    break;

                case  SONA_IN:
                    rc = sb_append_in( &sbd, expr );
                    break;
                case SONA_SA:
                //	rc = sb_append_sa( b, expr );
                    ASSERT_BSON_OK(rc);
                    break;

                default:
                    break;
            
            }
            
                // finish bson_t object
                rc = bson_append_document_end( b, &sbd );
                ASSERT_BSON_OK(rc);
         }

    }
    else if( IsA( x1, Aggref ) && IsA( x2, Const ) )
    {
        bson_t sbd;
        Aggref *ag = (Aggref*) x1;

        Const *c = (Const *)x2;
        bool found = false;
        char col_name[ NAMEDATALEN ] = {0};

        ListCell *n;

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
                    sprintf( col_name, "pscol%d", t->resno ); 
                    found = true;
                    break;
                }
            }

        }

        //const char * col_name = priv->nm[ v->varattno - 1].sn ;

        // ANY
        if( !found )
        {
            sl_log( INFO, "Warning:", "Aggref args not contain only TargetEntry\n" );
        }
        if( strcmp( op_name, OpMap [ SONA_NE ].pg_op  ) == 0 )
        {
            BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            sb_append_in( &sbd, expr );
            bson_append_document_end( b, &sbd );
        }
        else if( strcmp( op_name, OpMap [ SONA_EQ ].pg_op  ) == 0 ) //usrOr == 0
        {
            if( arrexpr->useOr )
            {
                BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
                sb_append_in( &sbd, expr );
                bson_append_document_end( b , &sbd );
            }
            else
                sb_append_arr_eq( b, col_name, c );
        }
        else
        {
            // start a new objet for each new expression
            rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            ASSERT_BSON_OK(rc);
        
            switch( opid )
            {
                case  SONA_LE:
                case  SONA_LT:
                case  SONA_GT:
                case  SONA_GE:
                case  SONA_EQ:
                case  SONA_NE:
                //	sb_append_xx( b, opid, c );
                    break;

                case  SONA_IN:
                    rc = sb_append_in( &sbd, expr );
                    break;
                case SONA_SA:
                //	rc = sb_append_sa( b, expr );
                    ASSERT_BSON_OK(rc);
                    break;

                default:
                    break;
            
            }
            
                // finish bson_t object
                rc = bson_append_document_end( b, &sbd );
                ASSERT_BSON_OK(rc);
         }
    }
    else // x1 is const, x2 is var
    {
        bson_t sbd;
        Var *v = (Var*)x2;
        Const *c = (Const *) x1;

        const char * col_name = priv->nm[ v->varattno - 1].sn ;

        // ANY
        if( strcmp( op_name, OpMap [ SONA_NE ].pg_op  ) == 0 )
        {
            BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            sb_append_in( &sbd, expr );
            bson_append_document_end( b, &sbd );
        }
        else if( strcmp( op_name, OpMap [ SONA_EQ ].pg_op  ) == 0 ) //usrOr == 0
        {
            if( arrexpr->useOr )
            {
                bson_t sbd2;
                BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
                BSON_APPEND_DOCUMENT_BEGIN( &sbd, "$elemMatch", &sbd2 );
                sb_append_eq( &sbd2, "$eq", c );
                bson_append_document_end( &sbd, &sbd2 );
                bson_append_document_end( b, &sbd );
            }
            else
                sb_append_arr_eq( b, col_name, c );
        }
        else
        {
            // start a new objet for each new expression
            rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
            ASSERT_BSON_OK(rc);
        
            switch( opid )
            {
                case  SONA_LE:
                case  SONA_LT:
                case  SONA_GT:
                case  SONA_GE:
                case  SONA_EQ:
                case  SONA_NE:
                //	sb_append_xx( &sbd, opid, c );
                    break;

                case  SONA_IN:
                    rc = sb_append_in( &sbd, expr );
                    break;
                case SONA_SA:
                //	rc = sb_append_sa( &sbd, expr );
                    ASSERT_BSON_OK(rc);
                    break;

                default:
                    break;
            
            }
            
                // finish bson_t object
                rc = bson_append_document_end( b, &sbd );
                ASSERT_BSON_OK(rc);
         }
    }

    return rc;
}


int
sr_nullexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where)
{

	int rc = false;

	NullTest * ntexpr = (NullTest*) expr;
    char col_name[ NAMEDATALEN ] = {0};

	Var * v = ( Var *) ntexpr->arg; 

    if( !v )
        return rc;

    if( IsA( v, Var) )
    {
        sprintf( col_name, "%s", priv->nm[v->varattno -1 ].pn );
    }
    else if( IsA( v, FuncExpr ) )
    {
        FuncExpr *f = (FuncExpr*) v;

        const char *fn = get_func_name( f->funcid );
        sprintf( col_name, "%s_%x", fn, (unsigned int)(uintptr_t )f->args );

        sp_project_func_restrict( priv, 0, ll,  f );
    }

    if( ntexpr->nulltesttype == IS_NULL )
    {
        rc = BSON_APPEND_NULL( b, col_name );
        ASSERT_BSON_OK(rc);
    }
    else // assume no error so it is ( ntexpr->nulltesttype == IS_NOT_NULL )
    {
        bson_t sbd;
        bson_t sbd2;
        rc = BSON_APPEND_DOCUMENT_BEGIN( b, col_name, &sbd );
        ASSERT_BSON_OK(rc);
        rc = BSON_APPEND_DOCUMENT_BEGIN( &sbd, "$not", &sbd2 );
        ASSERT_BSON_OK(rc);
        rc = BSON_APPEND_INT32( &sbd2,  "$type", 10 );		
        ASSERT_BSON_OK(rc);
        rc = bson_append_document_end( &sbd, &sbd2 );
        ASSERT_BSON_OK(rc);
        rc = bson_append_document_end( b, &sbd );
        ASSERT_BSON_OK(rc);
    }

	return rc;
}


int
sr_varexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,  // var boolean value not array related
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where)
{

	int rc = false;

	Var * v = ( Var *) expr; 
	const char * col_name =  priv->nm[v->varattno -1 ].pn; 

    if( !v && ! IsA( v, Var)  )
        return -1;

    rc = BSON_APPEND_BOOL( b,  col_name , in_array );
    ASSERT_BSON_OK(rc);

	return rc;
}

int
sr_trueexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,  // var boolean value not array related
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where)
{

	int rc = false;
    bson_t sbd;

    rc = BSON_APPEND_DOCUMENT_BEGIN( b, "_id", &sbd );
   
    ASSERT_BSON_OK(rc);

    rc = BSON_APPEND_BOOL( &sbd, "$exists", true );
    rc = bson_append_document_end( b, &sbd );
    ASSERT_BSON_OK(rc);

	return rc;
}

int
sr_paramexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,  // var boolean value not array related
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where)
{

    sl_log( INFO, "Warning:", "Sub query result depends outer query\n" );
	return -1;
}


int
sr_expr(
	 psc_private priv ,
	 const List * const exprs,
	 bson_t *bs ,
	 bool in_array,
	 array_unit *au,
     bool use_agg,
	 List **ll,
     bool where )
{

	int rc = false;
    const char *idx;

	ListCell *cell = NULL;


	foreach( cell, exprs ) 
    {
        List *l = 0;
        bson_t sbd;

        bson_t *b;

		Expr * expr = ( Expr *) lfirst( cell ) ;

		if( in_array )
		{
            idx = array_index( au );
			BSON_APPEND_DOCUMENT_BEGIN( bs, idx, &sbd );
            b = &sbd;
		}
        else
        {
            b = bs;
        }

		if( expr->type == T_RestrictInfo )
		{
				expr = (Expr*) ( ( RestrictInfo * ) lfirst ( cell ) )->clause;
		}

		if( IsA( expr, BoolExpr ) )
		{

			array_unit au = { 0 };	
			BoolExpr * blexpr = (BoolExpr*) expr ;
			switch( blexpr->boolop )
			{
				case AND_EXPR:
                {
                    bson_t sba;
					rc = BSON_APPEND_ARRAY_BEGIN( b, "$and", &sba );
					ASSERT_BSON_OK(rc);
					rc = sr_expr( 
						 priv,
						 blexpr->args,
						 &sba,
						 true,
						 &au,
                         use_agg,
                         ll ? ll : &l ,
                         where);

					rc = bson_append_array_end( b, &sba );
					ASSERT_BSON_OK(rc);
						break;
                }
				case OR_EXPR:
                {
                    bson_t sba;
					rc = BSON_APPEND_ARRAY_BEGIN( b, "$or", &sba );
					ASSERT_BSON_OK(rc);
					rc = sr_expr( 
						 priv,
						 blexpr->args,
						 &sba,
						 true,
						 &au,
                         use_agg,
                         ll ? ll : &l ,
                         where);
					ASSERT_BSON_OK(rc);
					rc = bson_append_array_end( b, &sba );
					ASSERT_BSON_OK(rc);
						break;
                }
						
				case NOT_EXPR:
                if( blexpr->args->length == 1 )
                {
                    Expr * expr = ( Expr *) lfirst( blexpr->args->head ) ;
                    if( IsA( expr, Var ) )
                    {
                        rc = sr_varexpr( 
                                 priv,
                                 blexpr->args,
                                 b,
                                 false,
                                 &au,
                                 expr,
                                 ll ? ll : &l,
                                 where );
                        break;

                    }
                    else if( IsA( expr, SubPlan ) )
                    {
                        rc = sr_subplan_expr( 
                                 priv,
                                 exprs,
                                 b,
                                 in_array,
                                 &au,
                                 expr,
                                 use_agg,
                                 ll ? ll : &l);

                        break;
                    }
                }
                else
                {
                    bson_t sba;
                    rc = BSON_APPEND_ARRAY_BEGIN( b, "$not", &sba );
                    ASSERT_BSON_OK(rc);
                    rc = sr_expr( 
                         priv,
                         blexpr->args,
                         &sba,
                         true,
                         &au,
                         use_agg,
                         ll ? ll : &l,
                         where );

                    ASSERT_BSON_OK(rc);
                    rc = bson_append_array_end( b, &sba );
                    ASSERT_BSON_OK(rc);
                }
                break;
				
			}
		}
        else if( IsA( expr, OpExpr ) )
		{
			rc = sr_opexpr( 
					 priv,
					 exprs,
					 b,
					 in_array,
					 au,
					 expr,
                     use_agg,
                     ll ? ll : &l,
                     where );
		}
        else if( IsA( expr, SubPlan ) )
		{
			rc = sr_subplan_expr( 
					 priv,
					 exprs,
					 b,
					 in_array,
					 au,
					 expr,
                     use_agg,
                     ll ? ll : &l);
		}
		else if( IsA( expr, ScalarArrayOpExpr ) )
		{
			rc = sr_arrayexpr( 
					 priv,
					 exprs,
					 b,
					 in_array,
					 au,
					 expr,
                     ll ? ll : &l,
                     where);
		}
		else if( IsA( expr, NullTest ) )
		{
			rc = sr_nullexpr( 
					 priv,
					 exprs,
					 b,
					 in_array,
					 au,
					 expr,
                     ll ? ll : &l,
                     where );
		}
		else if( IsA( expr, Var ) )
		{
			rc = sr_varexpr( 
					 priv,
					 exprs,
					 b,
					 true,
					 au,
					 expr,
                     ll ? ll : &l,
                     where );
		}
        else if( IsA( expr, FuncExpr ) )
        {
			rc = sr_trueexpr( 
					 priv,
					 exprs,
					 b,
					 true,
					 au,
					 expr,
                     ll ? ll : &l,
                     where );
        }
        else if( IsA( expr, Param ) )
        {
			rc = sr_paramexpr( 
					 priv,
					 exprs,
					 b,
					 true,
					 au,
					 expr,
                     ll ? ll : &l,
                     where );

        }

		if( in_array )
		{
			bson_append_document_end( bs, b );
		}
	}

	return rc;
}

int
sr_jointree_expr( 
     psc_private priv, 
     const List * const exprs,
     bson_t *b ,
     bool in_array,
     array_unit *au,
     Expr *expr,
     bool use_agg,
	 List **ll )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel; 
    FromExpr *fxr = ( FromExpr*)expr;
    List *fromlist = fxr->fromlist;

    ListCell *from;

    /// Join expr is only useful for JOIN_SEMI and SOIN_ANTI
    /// No explicit nor implicit join works here

    foreach( from, fromlist ) // fromlist->quals == 0
    {
        List *l = 0;
        Expr *rxpr = lfirst( from );
        if( IsA( rxpr, JoinExpr ) )
        {
            JoinExpr *join_expr = ( JoinExpr * )rxpr;
            Node *larg = join_expr->larg;
            Node *rarg = join_expr->rarg;
            Node * quals = join_expr->quals;


            if( join_expr->jointype != JOIN_SEMI && join_expr->jointype != JOIN_ANTI && join_expr->jointype != JOIN_INNER )
                continue;

            if( IsA( larg, RangeTblRef ) && IsA(rarg, RangeTblRef ) )
            { 
                sr_jointree_rtr_rtr( priv, exprs, b, in_array, au, join_expr, use_agg, ll ? ll : &l );
            }
            else if( IsA( larg, RangeTblRef ) && IsA(rarg, JoinExpr ) )
            {
            }
            else if( IsA( larg, JoinExpr) && IsA(rarg, RangeTblRef) ) 
            {
            }
            else if( IsA( larg, FromExpr) && IsA(rarg, RangeTblRef) ) 
            {
                sr_jointree_frmx_rtr( priv, exprs, b, in_array, au, join_expr, use_agg, ll ? ll : &l );
            }
            else if( IsA( larg, FromExpr) && IsA(rarg, FromExpr) ) 
            {
                sr_jointree_frmx_frmx( priv, exprs, b, in_array, au, join_expr, use_agg, ll ? ll : &l );
            }
            else if( IsA( larg, RangeTblRef) && IsA(rarg, FromExpr) ) 
            {
                sr_jointree_rtr_frmx( priv, exprs, b, in_array, au, join_expr, use_agg, ll ? ll : &l );
            }
            else 
               sl_log( INFO, "JoinExpr", "unprocessed JoinExpr type" );

        }
        else if( IsA( rxpr, RangeTblRef ) )
        {
            //sl_tag(( INFO, "sr_jointree_expr", "single node join" ));
        }
    }
    return 0;
}

bool 
sr_groupby_var( 
        psc_private priv,
        const Var *v,
        TargetEntry **te)
{
    PlannerInfo *root = priv->root;
    ListCell *l;
    foreach( l, root->parse->groupClause )
    {
        SortGroupClause*sgc = (SortGroupClause *) lfirst(l);
        TargetEntry* tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

        Expr *expr = tle->expr;
        if( IsA( expr, Var ) )
        {
            Var *x = (Var*)expr;
            if( x->varno == v->varno && x->varattno == v->varattno )
            {
                *te = tle;
                return true;
            }
        }
    }
    return false;
}

int sr_join_in( 
        psc_private priv,
        psc_private joinpriv,
        bson_t *b ,
        List *vpairs)
{
    int idx = 0;
    unsigned int ined = 0;
    int fields = vpairs->length;
    ListCell *c;

     bson_t ppb[3] ; 
     su_pair sps[3] =  { 0, 0, 0 };
     char fss[3][NAMEDATALEN] = { {0}, {0}, {0}};
     char flds[3][NAMEDATALEN] = { {0}, {0}, {0}};
     bson_t *lasts[3] = { 0, 0, 0 };
     array_unit array_indexes[3] = { { 0 }, { 0 }, { 0 } } ;

     if( fields > 3 )
     {
         sl_log( INFO, "Ignore join fields restriction", "Join fields more than 3 fields" );
         return -1;
     }
 
     foreach( c, vpairs )
     {
         sps[idx++] = lfirst( c );
     }

     for( idx = 0; idx < fields ; idx++ )
         bson_init( &ppb[idx] );

     if( joinpriv->uri->cursor )
     {
         const bson_t *r;

         for( idx = 0; idx < fields; idx ++ )
         {
         
             su_pair sp = sps[idx]; 
             Var *vl = (Var*)sp->k;
             Var *vr = (Var*)sp->v;

             if( joinpriv->t == query_distinct )
             {
                 sprintf( fss[idx], "_id.pscol%d", vr->varattno );
             }
             else if( joinpriv->t == query_regular )
             {
                 sprintf( fss[idx], "%s", joinpriv->nm[ vr->varattno -1].sn );
             }

             if( priv->t == query_distinct )
             {
                 sprintf( flds[idx], "pscol%d", vl->varattno );
             }
             else if( priv->t == query_regular )
             {
                 sprintf( flds[idx], "%s", priv->nm[ vl->varattno -1].sn );
             }
             else if( priv->t == query_group )
             {
                 TargetEntry *pp = 0;
                 if( su_var_grouped( priv, vl, &pp ) )
                     sprintf( flds[idx], "_id.pscol%d", pp->resno );
                  else
                     sprintf( flds[idx], "pscol%d", pp->resno );
             }
         }

             //bson_init( &sb );

             //rc = BSON_APPEND_ARRAY_BEGIN( &sb, "$in" , &sbin);
             //ASSERT_BSON_OK( rc );

         while ( mongoc_cursor_next( joinpriv->uri->cursor, &r) )
         {
             for( idx = 0; idx < fields; idx ++ )
             {
                 //su_push_bsonval_in_array( &ppb[idx], &array_indexes[idx], fss[idx], r );
                 ined += su_push_distinct_in_array( &ppb[idx], &array_indexes[idx], fss[idx], r, &lasts[ idx ] );
             }

             if( ined >= SONAR_IN_ARRAY_SIZE )
                 break;
         }

         for( idx = 0; idx < fields; idx ++ )
         {
             if( !bson_empty0( lasts[idx] ) )
                 bson_destroy( lasts[idx] );
         }

         mongoc_cursor_destroy( joinpriv->uri->cursor );
         joinpriv->uri->cursor = 0;
     }

     if( ined < SONAR_IN_ARRAY_SIZE )
     {
         for( idx = 0; idx < fields; idx++ )
         {
             bson_t tmp;
             BSON_APPEND_DOCUMENT_BEGIN( b, flds[idx], &tmp );
             BSON_APPEND_ARRAY( &tmp, "$in", &ppb[idx] );
             bson_append_document_end( b, &tmp ); 
         }
     }
     else
     {
         sl_log( LOG, "Ignore Subquery", "Sub query exceeds 1M values");
         return -1;
     }

     for( idx = 0; idx < fields; idx++ )
     {
         bson_destroy( &ppb[idx] );
     }

     return 0;
        
}

void sr_init_subquery(psc_private priv,
                      psc_private inpriv,
                      bson_t *b ,
                      Var *ov )
{
    int rc = 0;
    so_plan_scan( inpriv );
    so_scan_priv( inpriv );

    if( inpriv->uri->cursor )
    {
        array_unit idx = { 0 };
        const bson_t *r;
        bson_t sb;
        bson_t sbin;

        char fs[NAMEDATALEN] = {0};
        if( inpriv->t == query_group )
        {
            TargetEntry *e = lfirst( inpriv->L->head );
            sprintf( fs, "pscol%d", e->resno );
        }
        else
        {
            Var *iv = lfirst( inpriv->l->head );
            sprintf( fs, "pscol%d", iv->varattno );
        }

        if( priv->t == query_group )
        {
            bool find = false;
            char ofn[NAMEDATALEN] = {0};
            ListCell *c;
            foreach( c, priv->L )
            {
                TargetEntry *e = lfirst( c );
                Expr *expr = e->expr;
                if( IsA( expr, Var ) )
                {
                    Var *v = (Var*)expr;
                    if( v->varno == ov->varno && v->varattno == ov->varattno && e->resjunk == 1 )
                    {
                        sprintf( ofn, "_id.pscol%d", e->resno );
                        find = true;
                    }
                }
            }
            if( find )
                rc = BSON_APPEND_DOCUMENT_BEGIN( b, ofn, &sb ); // in b collections
            else
                sl_log( LOG, "sr_subplan_anysublink", "aggregation as subquery var" );
        }
        else
        {
            rc = BSON_APPEND_DOCUMENT_BEGIN( b, priv->nm[ ov->varattno -1 ].sn, &sb ); // in b collections
        }

        ASSERT_BSON_OK( rc );
       
        rc = BSON_APPEND_ARRAY_BEGIN( &sb, "$in" , &sbin);
        ASSERT_BSON_OK( rc );

        while ( mongoc_cursor_next( inpriv->uri->cursor, &r) )
        {
            su_push_bsonval_in_array( &sbin, &idx, fs, r );
        }

        bson_append_array_end( &sb, &sbin );

        bson_append_document_end( b, &sb );

        mongoc_cursor_destroy( inpriv->uri->cursor );
        inpriv->uri->cursor = 0;
    }
}


void sr_operator_field( psc_private priv, const Var *v, char *col_name, bool where) 
{
    TargetEntry *te;

    memset( col_name, 0, NAMEDATALEN );

    // aggregation functions are not allowed in where
    if( !where && priv->t == query_group &&  sr_groupby_var( priv, v, &te ) )
    {
        sprintf( col_name, "_id.pscol%d", te->resno );
    }
    else
    {
        sprintf( col_name, "%s", priv->nm[ v->varattno - 1].sn );
    }
}

bool sr_opexpr_vc(
         Expr *xr1,
         Expr *xr2,
         const Var **v,
         const Const **c)
{
    if( IsA( xr1, Var ) )
    {
        *v = ( Var * )xr1;
        *c = (Const *) xr2;
    }
    else
    {
        *v = ( Var * )xr2;
        *c = (Const *) xr1;
    }
}

void sr_dup_fld_expr( psc_private priv, bson_t *b, const List* exprs, Expr *expr, const char *col_name, bool where)
{
    ListCell *celln;
    char fn[ NAMEDATALEN ] = {0};

    foreach( celln, exprs )
    {
        Expr * exprn = ( Expr *) lfirst( celln ) ;

        if( exprn->type == T_RestrictInfo )
        {
                exprn = (Expr*) ( ( RestrictInfo * ) lfirst ( celln ) )->clause;
        }

        if( exprn == expr )
            continue;

        if( IsA( exprn, OpExpr ) )
        {
            OpExpr *opexprn = (OpExpr *) exprn;
            const char * op_namen = get_opname( opexprn->opno );

            if( opexprn->args->length == 2 )
            {
                Expr *xr1n  =  ( Expr * ) opexprn->args->head->data.ptr_value;
                Expr *xr2n  = ( Expr * ) opexprn->args->head->next->data.ptr_value;
                if( ( IsA( xr2n, Var )  && IsA( xr1n, Const )) ||  (IsA( xr1n, Var )  && IsA( xr2n, Const )) )
                {
                    const Var *v;
                    const Const *c;

                    sr_opexpr_vc( xr1n, xr2n, &v, &c );
                    sr_operator_field( priv, v, fn, where );
                    if( strcmp( col_name, fn ) == 0 )
                    {
                        snop_id opidn = su_sop_from_pg( op_namen );
                        sb_append_wild( b, opidn, exprn, c );
                    }
                }
            }
        }
    }
}

bool sr_has_param_restrict(
        psc_private priv,
        const List * const exprs)
{
	ListCell *cell = NULL;

	foreach( cell, exprs ) 
    {

		Expr * expr = ( Expr *) lfirst( cell ) ;
		if( expr->type == T_RestrictInfo )
		{
				expr = (Expr*) ( ( RestrictInfo * ) lfirst ( cell ) )->clause;
		}

		if( IsA( expr, Param ) )
            return true;
    }
    return false;
}

int
sr_jointree_rtr_rtr( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel; 
    JoinExpr *join_expr = ( JoinExpr * )expr;
      
    RangeTblRef *lrtr = (RangeTblRef*)join_expr->larg;
    RangeTblRef *rrtr = (RangeTblRef*)join_expr->rarg;
    Node * quals = join_expr->quals;
    int joindex = -1;

    if( lrtr->rtindex == baserel->relid )
    {
        joindex = rrtr->rtindex;
    }
    else if( rrtr->rtindex == baserel->relid )
    {
        joindex = lrtr->rtindex;
    }
    else
        return 0;


    if( IsA( quals, List ) )
    {
        List *pairs = 0;
        ListCell *qual;
        List *list = (List*) quals;
        RelOptInfo *joinrel = root->simple_rel_array[ joindex ]; 
        psc_private joinpriv = 0;

        if( joinrel->fdw_private )
        {
             SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
             SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

             if( !pls || !jpls )
                 return 0;

             if( pls->sizes.row_count < jpls->sizes.row_count )
                 return 0;

             so_init_private( root, joinrel, &joinpriv );
        }
        else
        {

            PlannerInfo *subroot = joinrel->subroot;
            if( subroot && subroot->simple_rel_array_size == 2 )
            {
                RelOptInfo *jr = subroot->simple_rel_array[1];
                SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                SonarPlanState *jpls = (SonarPlanState*)jr->fdw_private;

                if( !pls || !jpls )
                    return 0;
                if( pls->sizes.row_count < jpls->sizes.row_count )
                    return 0;

                so_init_private( subroot, jr, &joinpriv );
            }
        }

        if( !joinpriv)
            return 0;


         so_plan_scan(  joinpriv );
         so_scan_priv( joinpriv );


         foreach( qual, list )
         {
             Expr *x = ( Expr*) lfirst( qual );

             if( IsA( x, OpExpr ) )
             {
                 OpExpr *oxpr = (OpExpr *) x;
                 List *args = oxpr->args;

                 if( strcmp( get_opname( oxpr->opno ) , "=" ) == 0 )
                 {
                     Var *vl;
                     Var *vr;
                     Expr *vxpr1 = lfirst( args->head );
                     Expr *vxpr2 = lfirst( args->head->next );
                     if( IsA( vxpr1, Var ) && IsA( vxpr2, Var ) )
                     {
                         Var *tmp = (Var*)vxpr1;
                         if( tmp->varno == baserel->relid )
                         {
                             vl = tmp;
                             vr = (Var*)vxpr2;
                         }
                         else
                         {
                             vl = (Var*)vxpr2;
                             vr = tmp;
                         }

                         su_pair sp = malloc( sizeof( *sp ) );
                         memset( sp, 0, sizeof( *sp ) );
                         sp->k = vl;
                         sp->v = vr;
                         pairs = sl_lappend( pairs, sp );
                     }
                 }
             }
         }

         if( pairs )
         {
             sr_join_in( priv, joinpriv, b, pairs );
             sl_list_free_deep( pairs );
             pairs = 0;
         }
    }
    return 0;
}

int
sr_jointree_frmx_rtr( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel; 
    JoinExpr *join_expr = ( JoinExpr * )expr;
      
    FromExpr *lfxr = (FromExpr*)join_expr->larg;
    List *lfromlist = lfxr->fromlist;
    RangeTblRef *rrtr = (RangeTblRef*)join_expr->rarg;
    Node * quals = join_expr->quals;

    if( lfromlist->length ==1 )
    {
        Node *lnode = lfirst( lfromlist->head );

        if( IsA( lnode, RangeTblRef) )
        {
            RangeTblRef *lrtr = (RangeTblRef*)lnode;

            int joindex = -1;

            if( lrtr->rtindex == baserel->relid )
            {
                joindex = rrtr->rtindex;
            }
            else
                return 0;


            if( IsA( quals, List ) )
            {
                List *pairs = 0;
                ListCell *qual;
                List *list = (List*) quals;
                PlannerInfo *joinroot = root; 
                RelOptInfo *joinrel = joinroot->simple_rel_array[ joindex ]; 
                psc_private joinpriv = 0;

                if( joinrel->fdw_private )
                {
                     SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                     SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

                     if( !pls || !jpls )
                         return 0;

                }
                else
                {

                    joinroot = joinrel->subroot;
                    joinrel = joinroot->simple_rel_array[1];

                    if( joinroot && joinroot->simple_rel_array_size == 2 )
                    {
                        //RelOptInfo *jr = subroot->simple_rel_array[1];
                        SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                        SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

                        if( !pls || !jpls )
                            return 0;

                    }
                    else
                        return 0;
                }

                so_init_private( joinroot, joinrel, &joinpriv );

                if( !joinpriv)
                    return 0;


                 so_plan_scan(  joinpriv );
                 so_scan_priv( joinpriv );


                 foreach( qual, list )
                 {
                     Expr *x = ( Expr*) lfirst( qual );

                     if( IsA( x, OpExpr ) )
                     {
                         OpExpr *oxpr = (OpExpr *) x;
                         List *args = oxpr->args;

                         if( strcmp( get_opname( oxpr->opno ) , "=" ) == 0 )
                         {
                             Var *vl;
                             Var *vr;
                             
                            if( joindex == baserel->relid )
                            {
                                vl = lfirst( args->head );
                                vr = lfirst( args->head->next );
                            }
                            else
                            {
                                vr = lfirst( args->head );
                                vl = lfirst( args->head->next );
                            }

                             if( IsA( vl, Var ) && IsA( vr, Var ) )
                             {
                                 su_pair sp = malloc( sizeof( *sp ) );
                                 memset( sp, 0, sizeof( *sp ) );
                                 sp->k = vl;
                                 sp->v = vr;
                                 pairs = sl_lappend( pairs, sp );
                             }
                         }
                     }
                 }

                 if( pairs )
                 {
                     sr_join_in( priv, joinpriv, b, pairs );
                     sl_list_free_deep( pairs );
                     pairs = 0;
                 }
            }
        }
    }
    return 0;
}

int
sr_jointree_rtr_frmx( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel; 
    JoinExpr *join_expr = ( JoinExpr * )expr;
      
    RangeTblRef *lrtr= (RangeTblRef*)join_expr->larg;
    FromExpr *rfxr = (FromExpr*)join_expr->rarg;
    List *rfromlist = rfxr->fromlist;
    Node * quals = join_expr->quals;

    if( rfromlist->length == 1 )
    {
        Node *rnode = lfirst( rfromlist->head );

        if( IsA( rnode, RangeTblRef) )
        {
            RangeTblRef *rrtr = (RangeTblRef*)rnode;

            int joindex = -1;

            if( lrtr->rtindex == baserel->relid )
            {
                joindex = rrtr->rtindex;
            }
            else
                return 0;


            if( IsA( quals, List ) )
            {
                List *pairs = 0;
                ListCell *qual;
                List *list = (List*) quals;
                PlannerInfo *joinroot = root; 
                RelOptInfo *joinrel = joinroot->simple_rel_array[ joindex ]; 
                psc_private joinpriv = 0;

                if( joinrel->fdw_private )
                {
                     SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                     SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

                     if( !pls || !jpls )
                         return 0;

                }
                else if( joinrel->subroot )
                {

                    joinroot = joinrel->subroot;

                    if( joinroot && joinroot->simple_rel_array_size == 2 )
                    {
                        joinrel = joinroot->simple_rel_array[1];
                        //RelOptInfo *jr = subroot->simple_rel_array[1];
                        SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                        SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

                        if( !pls || !jpls )
                            return 0;

                    }
                    else
                        return 0;
                }
                else
                {
                    return 0;
                }

                so_init_private( joinroot, joinrel, &joinpriv );

                if( !joinpriv)
                    return 0;


                 so_plan_scan(  joinpriv );
                 so_scan_priv( joinpriv );


                 foreach( qual, list )
                 {
                     Expr *x = ( Expr*) lfirst( qual );

                     if( IsA( x, OpExpr ) )
                     {
                         OpExpr *oxpr = (OpExpr *) x;
                         List *args = oxpr->args;

                         if( strcmp( get_opname( oxpr->opno ) , "=" ) == 0 )
                         {
                             Var *vl;
                             Var *vr;
                             
                            if( joindex == baserel->relid )
                            {
                                vl = lfirst( args->head );
                                vr = lfirst( args->head->next );
                            }
                            else
                            {
                                vr = lfirst( args->head );
                                vl = lfirst( args->head->next );
                            }

                             if( IsA( vl, Var ) && IsA( vr, Var ) )
                             {
                                 su_pair sp = malloc( sizeof( *sp ) );
                                 memset( sp, 0, sizeof( *sp ) );
                                 sp->k = vl;
                                 sp->v = vr;
                                 pairs = sl_lappend( pairs, sp );
                             }
                         }
                     }
                 }

                 if( pairs )
                 {
                     sr_join_in( priv, joinpriv, b, pairs );
                     sl_list_free_deep( pairs );
                     pairs = 0;
                 }
            }
        }
    }
    return 0;
}

int
sr_jointree_frmx_frmx( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel; 
    JoinExpr *join_expr = ( JoinExpr * )expr;
      
    FromExpr *lfxr = (FromExpr*)join_expr->larg;
    List *lfromlist = lfxr->fromlist;
    FromExpr *rfxr = (FromExpr*)join_expr->rarg;
    List *rfromlist = rfxr->fromlist;
    Node * quals = join_expr->quals;

    if( lfromlist->length ==1 && rfromlist->length == 1 )
    {
        Node *lnode = lfirst( lfromlist->head );
        Node *rnode = lfirst( rfromlist->head );

        if( IsA( lnode, RangeTblRef) && IsA( rnode, RangeTblRef ) )
        {
            RangeTblRef *lrtr = (RangeTblRef*)lnode;
            RangeTblRef *rrtr = (RangeTblRef*)rnode;

            int joindex = -1;

            if( lrtr->rtindex == baserel->relid )
            {
                joindex = rrtr->rtindex;
            }
            else
                return 0;


            if( IsA( quals, List ) )
            {
                List *pairs = 0;
                ListCell *qual;
                List *list = (List*) quals;
                PlannerInfo *joinroot = root; 
                RelOptInfo *joinrel = joinroot->simple_rel_array[ joindex ]; 
                psc_private joinpriv = 0;

                if( joinrel->fdw_private )
                {
                     SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                     SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

                     if( !pls || !jpls )
                         return 0;

                }
                else
                {
                    if( joinrel->subroot )
                    {

                        joinroot = joinrel->subroot;
                        joinrel = joinroot->simple_rel_array[1];

                        if( joinroot && joinroot->simple_rel_array_size == 2 )
                        {
                            //RelOptInfo *jr = subroot->simple_rel_array[1];
                            SonarPlanState *pls = (SonarPlanState*)baserel->fdw_private;
                            SonarPlanState *jpls = (SonarPlanState*)joinrel->fdw_private;

                            if( !pls || !jpls )
                                return 0;

                        }
                        else return 0;
                    }
                    else
                        return 0;
                }

                so_init_private( joinroot, joinrel, &joinpriv );

                if( !joinpriv)
                    return 0;


                 so_plan_scan(  joinpriv );
                 so_scan_priv( joinpriv );


                 foreach( qual, list )
                 {
                     Expr *x = ( Expr*) lfirst( qual );

                     if( IsA( x, OpExpr ) )
                     {
                         OpExpr *oxpr = (OpExpr *) x;
                         List *args = oxpr->args;

                         if( strcmp( get_opname( oxpr->opno ) , "=" ) == 0 )
                         {
                             Var *vl;
                             Var *vr;
                             
                            if( joindex == baserel->relid )
                            {
                                vl = lfirst( args->head );
                                vr = lfirst( args->head->next );
                            }
                            else
                            {
                                vr = lfirst( args->head );
                                vl = lfirst( args->head->next );
                            }

                             if( IsA( vl, Var ) && IsA( vr, Var ) )
                             {
                                 su_pair sp = malloc( sizeof( *sp ) );
                                 memset( sp, 0, sizeof( *sp ) );
                                 sp->k = vl;
                                 sp->v = vr;
                                 pairs = sl_lappend( pairs, sp );
                             }
                         }
                     }
                 }

                 if( pairs )
                 {
                     sr_join_in( priv, joinpriv, b, pairs );
                     sl_list_free_deep( pairs );
                     pairs = 0;
                 }
            }
        }
    }
    return 0;
}

int
sr_subplan_anysublink( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    List *nel;
    SubPlan *sp = (SubPlan*) expr;
    Node *testexpr = sp->testexpr;

    if( IsA( testexpr, OpExpr ) )
    {
        OpExpr *toe = (OpExpr*) testexpr;
        if( toe->args->length == 2 )
        {
            Expr *expr1 = lfirst(toe->args->head );
            Expr *expr2 = lfirst(toe->args->head->next );

            if( IsA( expr1, FuncExpr ) && IsA( expr2, Param ) )
            {
                FuncExpr *func = (FuncExpr*) expr1;
                Param *param = ( Param *)expr2;
                if( func->funcformat == COERCE_IMPLICIT_CAST && func->args->length == 1 )
                {
                    Expr *arg = lfirst( func->args->head );
                    if( IsA( arg, Var ) )
                    {
                        Var *v = (Var*)arg;
                        PlannerInfo *rt;

                        if( ss_subquery_private( priv, &rt ) )
                        {
                            psc_private inpriv;
                            RelOptInfo *rel = rt->simple_rel_array[1] ;
                            //Var* vr = (Var*) rel->reltargetlist->head->data.ptr_value;

                            so_init_private( rt, rel, &inpriv );

                            sr_init_subquery( priv, inpriv, b, v );
                        }
                    }
                }
            }
            else
                sl_log( LOG, "sr_subplan_anysublink", "OpExpr unprocessed args type" );
        }
        else
        {
            sl_log( LOG, "sr_subplan_anysublink", "OpExpr args not 2" );
        }
    }
}

int
sr_subplan_nonexist( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll )
{
    SubPlan *sp = (SubPlan*) expr;
    Node *testexpr = sp->testexpr;
    if( testexpr && IsA( testexpr, OpExpr ) )
    {
        OpExpr *toe = (OpExpr*) testexpr;

        if( toe->args->length == 2 )
        {
            Expr * txr1 = (Expr*) lfirst( toe->args->head );
            Expr * txr2 = (Expr*) lfirst( toe->args->head->next );
            if( IsA( txr1, Var ) && IsA( txr2, Param ) )
            {
                //bson_t inb[1];
                Var *v = ( Var *)txr1;
                //Param *p = (Param * )txr2;
                PlannerInfo *rt;

                //int idx = p->paramid;
                if( ss_subquery_private( priv, &rt ) )
                {
                    psc_private inpriv;
                    RelOptInfo *rel = rt->simple_rel_array[1] ;
                    //Var* vr = (Var*) rel->reltargetlist->head->data.ptr_value;

                    so_init_private( rt, rel, &inpriv );

                    if( priv->t != query_xsub )
                    {
                        sr_init_subquery( priv, inpriv, b, v );
                    }
                    else
                    {
                        bson_t bin;
                        bson_t bns;
                        Var* vr = (Var*) rel->reltargetlist->head->data.ptr_value;
                        BSON_APPEND_DOCUMENT_BEGIN( b, priv->nm[ v->varattno -1].sn, &bin );
                        BSON_APPEND_DOCUMENT_BEGIN(&bin, "$in", &bns );
                        BSON_APPEND_UTF8( &bns, "$ns", inpriv->uri->collection_name );
                        BSON_APPEND_DOCUMENT( &bns, "$q", inpriv->q );
                        BSON_APPEND_UTF8( &bns, "$p", inpriv->nm[ vr->varattno -1].sn );
                        bson_append_document_end( &bin, &bns);
                        bson_append_document_end( b, &bin );
                    }
                }

            }
        }
    }
}

void sr_bson_append_via_op(
        bson_t *b,
        snop_id opid,
        const char* prjkey,
        const Const * c)
{
    int rc = 0;

    if( opid == SONA_EQ )
    {
        sb_append_eq( b, prjkey, c );
    }
    else //XXX ...
    {
        bson_t tmp;
        rc = BSON_APPEND_DOCUMENT_BEGIN( b, prjkey, &tmp);

        ASSERT_BSON_OK( rc );

//XXX regex should be processed here. need develop case
        switch( opid )
        {
            case  SONA_LE:
            case  SONA_LT:
            case  SONA_GT:
            case  SONA_GE:
            case  SONA_EQ:
            case  SONA_NE:
                {
                    sb_append_xx( &tmp, opid, c );
                }
                break;
            default:
            sl_log( INFO, "math operator", "operation not supported yet" );
            break;
        }
        bson_append_document_end( b, &tmp );
    }
}
