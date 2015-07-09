
#ifndef  __SONAR_MIS_H__
#define __SONAR_MIS_H__


query_enum sm_query_type(PlannerInfo *root,
                       RelOptInfo *baserel,
                       psc_private priv);

bool sm_has_func_restrict( List * exprs, 
                       psc_private priv);

bool sm_var_contained( psc_private priv, List *l, Var *v );

bool sm_target_contained(
		 psc_private priv,
		 List *l,
		 TargetEntry *e ) ;

void sm_project_op( psc_private priv, OpExpr *op, TargetEntry *org );
void sm_project_coerce( psc_private priv, CoerceViaIO *cvi );

bool
sm_is_xfunc( FuncExpr *f  );

bool
sm_has_xfunc( psc_private priv );

bool
sm_aggref_has_xfunc( Aggref *ref );

bool
sm_boolxpr_has_xfunc( BoolExpr *bxpr );

bool
sm_opxpr_has_xfunc( OpExpr *opxpr );

void sm_project_ab( psc_private priv, bson_t *mpb,  const char* key, const char *val );
#endif
