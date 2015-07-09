/*
 * sonar_project.h
 *
 *  Created on: Fri Nov 21 11:29:50 PST 2014
 *      Author: CUI, SHU HAI
 */

#ifndef SONAR_PROJECT_H_
#define SONAR_PROJECT_H_


void sp_project_var_restrict(
		 psc_private priv,
		 List **ll,
         const Var *v);
/** subsrtring project */
void sp_project_substr(
		 bson_t *b,
		 const char *dum_fld,
		  const char* fld,
		 int start,
		 int len );

void sp_project_substr_pattern(
		 bson_t *b,
		 const char *dum_fld,
		  const char* fld,
		 const char* pattern); 

void sp_project_substr_deep(
		 psc_private priv,
		 TargetEntry * org,
		 FuncExpr *fxpr );

void sp_project_substr_restrict(
		 psc_private priv,
		 TargetEntry * org,
		 List **ll,
		 FuncExpr *fxpr );
//** concatnation basic */
void sp_project_xcat(
		 bson_t *b,
		 const char *dum_fld,
		  const char* fld1,
		 const char* fld2 );

void sp_project_xcat_raw(
		 bson_t *b,
		 const char *dum_fld,
		  const char* fld1,
		 const char* fld2 );


void sp_project_opcat_opxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const OpExpr *opxpr );

void sp_project_opcat_fxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr );

void sp_project_opcat_substr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr );

void sp_project_opcat_lowerupper(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr );

void sp_project_opcat_strcat(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
         array_unit * au,
		 const FuncExpr *fxpr );


void sp_project_opcat_restrict(
		 psc_private priv,
		 List **ll,
		 const OpExpr *opxpr );

//** concat function */
void sp_project_concat_args(
		 psc_private priv,
		 bson_t *b,
		 const char *dum_fld,
		 const List * flds);

//** concat function */
void sp_project_concatws_args(
		 psc_private priv,
		 bson_t *b,
		 const char *dum_fld,
		 const List * flds);

void sp_project_concat_deep(
		 psc_private priv,
		 TargetEntry * org,
		 const OpExpr *opxpr );

void sp_project_concat_restrict(
		 psc_private priv,
		 List **ll,
		 const FuncExpr *fxpr );

void sp_project_concatws_restrict(
		 psc_private priv,
		 List **ll,
		 const FuncExpr *fxpr );

//** textcat function */
void sp_project_textcat(
		 bson_t *b,
		 const char *dum_fld,
		  const char* fld1,
		 const char* fld2 );

void sp_project_textcat_deep(
		 psc_private priv,
		 TargetEntry * org,
		 FuncExpr *f );

void sp_project_textcat_restrict(
		 psc_private priv,
		 List **ll,
		 FuncExpr *f );

void sp_project_lowerupper(
		 bson_t *b,
		 const char* outfild,
		  const char *fld,
		 const char *fn );

void sp_project_lowerupper_deep(
		 psc_private priv,
		 TargetEntry * org,
		 FuncExpr *fxpr );

void sp_project_lowerupper_restrict(
		 psc_private priv,
		 List **ll,
		 FuncExpr *fxpr );

void sp_project_func(
		 bson_t *b,
		 const char *key,
		 FuncExpr *f );

void sp_project_func_deep(
		 psc_private priv,
		 TargetEntry * org,
		 FuncExpr *f );

void sp_project_func_restrict(
		 psc_private priv,
		 TargetEntry * org,
		 List **ll,
		 FuncExpr *f );

void sp_project_math_var_var(
		 psc_private priv,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math_var_const(
		 psc_private priv,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math_const_var(
		 psc_private priv,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math_opxpr_const(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math_const_opxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math_opxpr_var(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math_var_opxpr(
		 psc_private priv,
		 List **ll,
		 bson_t *b,
		 const OpExpr *opxpr );

void sp_project_math(
		 bson_t *b,
		 const char *key,
         snop_id opid,
         const char* fld1,
         const char * fld2);

void sp_project_math_vconst(
		 bson_t *b,
		 const char *key,
         snop_id opid,
         const char* fld1,
         const Const * fld2);

void sp_project_math_constv(
		 bson_t *b,
		 const char *key,
         snop_id opid,
         const Const * fld1,
         const char* fld2);

void sp_project_math_deep(
		 psc_private priv,
		 TargetEntry * org,
		 const OpExpr *opxpr );

void sp_project_math_restrict(
		 psc_private priv,
		 List **ll,
		 const OpExpr *opxpr );

void sp_project_coerce(
		bson_t *b,
		const char *projkey,
		CoerceViaIO *f );

void sp_project_coerce_deep(
		 psc_private priv,
		 TargetEntry * org,
		 CoerceViaIO *f );

void sp_project_coerce_restrict(
		 psc_private priv,
		 List **ll,
		 CoerceViaIO *f );

void sp_project_operator(
		 bson_t *b,
		 const char *key,
		 const OpExpr *f );

void sp_project_opeartor_deep(
		 psc_private priv,
		 List **ll,
		 const OpExpr *f );

void sp_project_opeartor_restrict(
		 psc_private priv,
		 List **ll,
		 const OpExpr *f );

#endif /* SONAR_PROJECT_H_ */

