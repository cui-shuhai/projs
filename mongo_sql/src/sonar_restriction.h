#ifndef __SONAR_WHERE_EXPR_H__
#define __SONAR_WHERE_EXPR_H__

#include "sonar_nm.h"


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
		 bool where);

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
		 bool where);

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
		 bool where);

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
		 bool where);

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
		 bool where);

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
		 bool where);

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
		 bool where);

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
		 bool where);

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
		 bool where);


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
		 bool where);


int
sr_nullexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where);


/** query restriction exprssin bilder
 * this works for all the restriction exprs: where, having etc
 */
int
sr_expr(
	 psc_private priv ,         /* provide the postges to mongo name map */
	 const List * const exprs,  /* postgrs restriction expressins */
	 bson_t *b ,                  /* bon object for mongo query filter */
	 bool in_array,             /* whether the sube expressin in array */
	 array_unit *au,            /* array index */
     bool use_agg,          /* flag for build querying field name */
     List **ll,
     bool where);


int
sr_subplan_anysublink( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_subplan_nonexist( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_subplan_expr( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_jointree_rtr_rtr( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_jointree_frmx_rtr( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_jointree_rtr_frmx( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_jointree_frmx_frmx( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_jointree_expr( 
		 psc_private priv, 
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,
		 array_unit *au,
		 Expr *expr,
         bool use_agg,
		 List **ll );

int
sr_varexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,  // var boolean value not array related
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where);

int
sr_trueexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,  // var boolean value not array related
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where);

int
sr_paramexpr( 
		 psc_private priv ,
		 const List * const exprs,
		 bson_t *b ,
		 bool in_array,  // var boolean value not array related
		 array_unit *au,
		 Expr *expr,
		 List **ll ,
		 bool where);


bool 
sr_groupby_var( 
        psc_private priv,
        const Var *v,
        TargetEntry **te);

int sr_join_in( 
        psc_private priv,
        psc_private joinpriv,
        bson_t *b ,
        List *vpairs);


void sr_operator_field(
		 psc_private priv,
         const Var *v,
		 char *col_name,
		 bool where);

bool sr_opexpr_vc(
         Expr *expr1,
         Expr *expr2,
         const Var **v,
         const Const **c);

void sr_dup_fld_expr(
		 psc_private priv,
		 bson_t *b,
		 const List* exprs,
		 Expr *expr,
		 const char *col_name,
		 bool where);
bool sr_has_param_restrict(
        psc_private priv,
        const List * const exprs);

void sr_bson_append_via_op(
        bson_t *b,
        snop_id opid,
        const char* key,
        const Const * c);
                
#endif
