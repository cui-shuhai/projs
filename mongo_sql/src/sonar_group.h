#ifndef __SONAR_GROUP_H__
#define __SONAR_GROUP_H__




/** parse Query::targetList for all aggregation queries 
*/
bool 
sg_plan_scan( psc_private  priv, Var* v, Datum d );

bool
sg_plan_rescan( psc_private  priv, Var* v, Datum d );

void
sg_scan( psc_private priv );

TupleTableSlot *
sg_iterate(ForeignScanState *node );

bool sg_func_has(
		FuncExpr *f,
		TargetEntry *e );

bool sg_var_has(
		Var *v,
		TargetEntry *e );

bool sg_unique_tlev(
		List *l,
		TargetEntry* e );

bool sg_te_contained(
		List *l,
		TargetEntry* e );



int sg_append_field_count(
        psc_private priv,
        bson_t * b,
        const void *nv,
        bool field  );

int sg_append_func_count(
        psc_private priv,
        bson_t * b,
        FuncExpr *fxpr );

int sg_append_op_count(
        psc_private priv,
        bson_t * b,
        OpExpr *opxpr );

int sg_append_func_avg(
        psc_private priv,
        bson_t * b,
        FuncExpr *fxpr );

int sg_append_op_avg(
        psc_private priv,
        bson_t * b,
        OpExpr *opxpr );

void sg_append_opcat_count(
		psc_private priv,
		bson_t *b,
		OpExpr *fxpr );

void sg_append_substr_count(
		psc_private priv,
		bson_t *b,
		FuncExpr *fxpr );

void sg_append_concat_count(
		psc_private priv,
		bson_t *b,
		FuncExpr *fxpr );

void sg_append_lowwerupper_count(
		psc_private priv,
		bson_t *b,
		FuncExpr *fxpr );

void sg_append_aggregate(
		psc_private priv,
		TargetEntry* org,
		bson_t *b,
		Aggref* ag );

void sg_append_func(
		psc_private priv,
		TargetEntry *org,
		bson_t *b,
		FuncExpr *f );

void sg_append_aggregate_coerce(
		psc_private priv,
		TargetEntry* org,
		bson_t *b,
		Aggref* ag,
		CoerceViaIO * cvi );

void sg_unify_mp1(
		psc_private priv,
		List **lpp,
		List **list );

void sg_unify_mp2(
		psc_private priv,
		List **lpp,
		List *lp,
		List **list );

void sg_create_aggregation(
		psc_private priv,
		bson_t *sb );

void sg_create_firsts(
		psc_private priv,
		bson_t *sb );

void sg_mark_group_tle(
		psc_private priv );

#endif
