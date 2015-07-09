
/*! sonar_mis.c 
 *  miscillaneous api implementation. helps classify query types, and 
 *
 * Date: : Wed Sep 17 10:15:21 PDT 2014
 * Author : CUI, SHU HAI
 */

#include <signal.h>


#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_pg.h"
#include "sonar_join.h"
#include "sonar_project.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_restriction.h"



/* checking queyr to decide  query type */
query_enum sm_query_type(PlannerInfo *root,
                       RelOptInfo *baserel,
                       psc_private priv)
{
    ListCell *c;

	priv->t = query_invalid;
    //return true;  //XXX tmp test

    if( sj_sonar_join( root, baserel, priv ) )
      return priv->t;

    if( sx_is_xsub( root, baserel, priv ) )
      return priv->t;

    if( sm_has_xfunc( priv ) )
        return priv->t = query_regular;

    if( sr_has_param_restrict( priv, baserel->baserestrictinfo ))
        return priv->t = query_regular;

    if( root->parse->hasSubLinks )
    {
        if( root->parse->havingQual )
        {
            List *l = ( List* )root->parse->havingQual;
            foreach( c, l )
            {
                Expr *expr = lfirst( c );

                if( IsA( expr, SubPlan ) )
                {
#if 0
                    SubPlan *subplan = (SubPlan*)expr;
                    Node *node = subplan->testexpr;
                    if( IsA( node, OpExpr ) )
                    {
                        OpExpr *x = (OpExpr*) node;
                        ListCell *xc;
                        foreach( xc , x->args )
                        {
                            Expr *xe = lfirst( xc );
                            if( IsA( xe, Param ) )
                            {
                               Param *p = (Param * )xe ;
                               if( p->paramkind == PARAM_EXEC)
                               {
                                   priv->t = query_regular;
                               }
                            }

                        }
                    }
#endif
                }
                else if( IsA( expr, OpExpr ) )
                {
                    OpExpr *x = (OpExpr*) expr;
                    ListCell *xc;
                    foreach( xc , x->args )
                    {
                        Expr *xe = lfirst( xc );
                        if( IsA( xe, Param ) )
                        {
                           Param *p = (Param * )xe ;
                           if( p->paramkind == PARAM_EXEC)
                           {
                               return priv->t = query_regular;
                           }
                        }

                    }
                }
            }

        }
    }

/*
    if( root->query_level >= 2 )
    {
        if( root->parse->hasAggs == 1 &&  root->parent_root->parse->hasAggs ==1 )
            priv->t = query_regular;
    }
    */

    if( priv->L )
    {
        foreach( c, priv->L )
        {
            TargetEntry *e = ( TargetEntry*)lfirst( c );
            
            //const char* alias = e->resname;

            Expr *expr = e->expr;


            if( IsA ( expr, FuncExpr ) )
            {
                FuncExpr *fx = (FuncExpr*) expr;

                const char* fname = get_func_name( fx->funcid );

                if( !strcmp( fname , "lower" ) )
                    continue;
                if( !strcmp( fname , "upper" ) )
                    continue;
                if( !strcmp( fname , "substr" ) )
                    continue;
                if( !strcmp( fname , "substring" ) )
                    continue;
                if( !strcmp( fname , "unnest" ) )
                    continue;

                return priv->t = query_regular;
            }
            else if( IsA ( expr, Aggref ) )
            {
                Aggref *aref = (Aggref*) expr;
                if( aref->aggdistinct )
                    return priv->t = query_regular;
            }
        }

    }

    if( root->parse->groupClause )
    {
        ListCell *l;
        foreach(l, root->parse->groupClause)
        {   
            TargetEntry* tle = 0;

            SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

            sp_get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList, &tle);

            if(tle ) // find one distinct col
            {   
                Expr*v = (Expr*) tle->expr;
                if( IsA( v, CaseExpr ) )
                {
                    return priv->t = query_regular;
                }

            }   
        }   

        if( root->parent_root )
        {
            PlannerInfo *rt = root->parent_root;
            while( rt )
            {
                if( rt->parse->groupClause )
                    return priv->t = query_regular;
                    
                rt = rt->parent_root;
            }
        }
    }


    if( baserel->baserestrictinfo )
    {
        if( sm_has_func_restrict( baserel->baserestrictinfo, priv ))
        {
            return priv->t = query_regular;
        }
    }

    if( root->parse->groupClause && !sj_is_join( root ) && root->query_level < 3) //GROUP BY, HAVING
    {
       ListCell *l;

       foreach( l, root->parse->groupClause )
       {
            SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

            TargetEntry* tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

            if(tle ) // find one distinct col
            {   
                Expr *expr  = tle->expr;

                if( IsA( expr, FuncExpr ) )
                {
                    FuncExpr *func_expr = (FuncExpr*) expr;
                    const char * func_name = get_func_name( func_expr->funcid );
                    if( strcmp( func_name, "substring" ) == 0 )
                        continue;
                    if( strcmp( func_name, "substr" ) == 0 )
                        continue;
                    if( strcmp( func_name, "lower" ) == 0 )
                        continue;
                    if( strcmp( func_name, "upper" ) == 0 )
                        continue;

                    //XXX more porcessible functions by pass

                   return priv->t = query_regular; 
                }
            }   
         }
         return priv->t = query_group; 
    }

    if( root->parse->hasAggs && !sj_is_join( root ) )
    {
        if( !( root->parent_root && root->query_level >= 2 ) )  //XXX this will be removed finally
        return priv->t = query_aggregation;
    }

    //if (root->parse->distinctClause || ss_is_subquery( root, baserel, priv ) )
    if (root->parse->distinctClause &&  !sj_is_join( root ) ) 
    {
        return priv->t = query_distinct;
    }


    return priv->t = query_regular;
}


bool sm_has_func_restrict( List * exprs, psc_private priv )
{
    bool rc = false;
    ListCell *cell;
    Expr *expr;

    const FuncExpr * f = (FuncExpr *) get_arg_by_type( exprs, T_FuncExpr);

    if( f && sm_is_xfunc( f ) )

        return true;

	foreach( cell, exprs )
    {
        expr = ( Expr *) lfirst( cell ) ;

        if( expr->type == T_RestrictInfo )
        {
            expr = (Expr*) ( ( RestrictInfo * ) lfirst ( cell ) )->clause;
        }
        else//  if( expr0->type == T_Var )
            continue;

        if( IsA( expr, BoolExpr ) )
        {

            BoolExpr * blexpr = (BoolExpr*) expr ;
            rc = sm_has_func_restrict( blexpr->args,priv );

            if( rc )
                return rc;
        }
		else if( IsA( expr, OpExpr ) )
		{
            OpExpr * oxpr = (OpExpr*) expr;
            rc = sm_has_func_restrict( oxpr->args,priv );

            if( rc )
                return rc;
		}
	}
    return rc;
}

bool sm_var_contained( psc_private priv, List *l, Var *v )
{
    ListCell* c;

    const char * name = priv->nm[ v->varattno -1 ].sn;

    foreach( c, l )
    {
        Var* node = ( Var *)lfirst( c );
        const char *n = priv->nm[ node->varattno-1 ].sn;

        if( node->varno == v->varno && node->varattno == v->varattno  )
            continue;

        if( su_name_cover( n, name ) )
            return true;

    }

    return false;
}

bool sm_target_contained(
		 psc_private priv,
		 List *l,
		 TargetEntry *e ) 
{
    char fld[ NAMEDATALEN ] = {0};

    ListCell *c;

    su_target_json_field( priv, e, fld );

    foreach( c, l )
    {
        TargetEntry *te = ( TargetEntry*)lfirst( c );
        char tmp[ NAMEDATALEN ] = {0};

        if( e == te )
            continue; 

        su_target_json_field( priv, te, tmp );

        if( su_name_cover( tmp, fld ) )
            return true;
    }

    return false;
}

void sm_project_op( psc_private priv, OpExpr *op, TargetEntry *org )
{
	const char * fn = get_func_name( op->opfuncid );
    List *args = op->args;

    if( strcmp( fn, "textcat" ) == 0 )
    {
        if( args->length == 2 )
        {
            char concat_fld[ NAMEDATALEN ] = {0};

            Var *xpr1 = lfirst( args->head );
            Var *xpr2 = lfirst( args->head->next );

            if( IsA( xpr1, Var ) && IsA( xpr2, Var ) )
            {

                Var *v1 = (Var*)xpr1;
                Var *v2 = (Var*)xpr2; 
                bson_t *b = bson_new();

                sprintf( concat_fld, "%s_%x", fn, (unsigned int )(uintptr_t )op->args );

                sp_project_xcat( b, concat_fld, priv->nm[ v1->varattno - 1].sn, priv->nm[ v2->varattno -1 ].sn );

                priv->projs0[ org->resno -1 ] = lappend( priv->projs0[ org->resno -1], b );
            }
            else if( IsA( xpr1, OpExpr ) )
            {
                char fld[ NAMEDATALEN ] = {0};
                OpExpr *opxpr = (OpExpr*)xpr1;
                bson_t *b = bson_new();

                const char * fldn = get_func_name( opxpr->opfuncid );

                sm_project_op( priv, opxpr, org );

                if( IsA( xpr2, CoerceViaIO ) )
                {
                    CoerceViaIO *cvi = (CoerceViaIO*) xpr2;
                    Var *v = (Var*)cvi->arg;

                    sprintf( concat_fld, "%s_%x", fn, (unsigned int )(uintptr_t )op->args );
                    sprintf( fld, "%s_%x", fldn, (unsigned int )(uintptr_t )opxpr->args );

                    sp_project_xcat( b, concat_fld, fld, priv->nm[ v->varattno -1].sn  ); 
                    priv->projs0[ org->resno -1 ] = lappend( priv->projs0[ org->resno -1 ], b );
                }
            }
        }
    }
}


bool
sm_is_xfunc( FuncExpr *f  )
{
    const char* fn = get_func_name( f->funcid );

    if( strcmp( fn, "substring" ) == 0 || strcmp( fn, "substr" ) == 0 )
    {
        List *l = f->args;
        if( l->length == 3 )
        {
            Var *v = lfirst( l->head );
            Const *c1 = lfirst( l->head->next );
            Const *c2 = lfirst( l->head->next->next );

            if( IsA( v, Var) && IsA( c1, Const ) && IsA( c2, Const ) )
            {
                return false;
            }
            else if( IsA( v, OpExpr ) )
            {
                return sm_opxpr_has_xfunc( (OpExpr*)v );

            }
            else if( IsA( v, FuncExpr ) )
            {
                return sm_is_xfunc( (FuncExpr*)v );
            }
        }
        else if( l->length == 2 )
        {
            Var *v = lfirst( l->head );
            Const *c1 = lfirst( l->head->next );

            if( IsA( v, Var) && IsA( c1, Const ) )
            {
                if( ((Const*)c1)->consttype == TEXTOID )
                    return true;
                return false;
            }
            else if( IsA( v, OpExpr ) )
            {
                return sm_opxpr_has_xfunc( (OpExpr*)v );

            }
            else if( IsA( v, FuncExpr ) )
            {
                return sm_is_xfunc( (FuncExpr*)v );
            }
        }
        else
        {
            return true;
        }
    }
    else if( strcmp( fn, "lower" ) == 0 || strcmp( fn, "upper") == 0 )
    {
        List *args = f->args;
        ListCell *cell;
        foreach( cell, args )
        {
            Expr *xpr = lfirst( cell );
            if( IsA( xpr, FuncExpr ) )
            {
                FuncExpr *func = (FuncExpr *) xpr;
                if( sm_is_xfunc( func ) )
                    return true; 
            }
            else if( IsA( xpr, Var ) )
            {
                return false;
            }
            else
                return true;
           return false;

        }
    }
    else if( strcmp( fn, "concat" ) == 0 || strcmp( fn, "concat_ws" ) == 0 )
    {
        List *args = f->args;
        ListCell *c;
        foreach( c, args )
        {
            Expr *xpr = lfirst( c );
            if( IsA( c, FuncExpr ) )
            {
                FuncExpr *func = (FuncExpr *) xpr;
                if( sm_is_xfunc( func ) )
                    return true; 
            }
        }
        return false;
    }
    else if( strcmp( fn, "textcat" ) == 0 )
    {
        List *args = f->args;
        ListCell *c;
        foreach( c, args )
        {
            Expr *xpr = lfirst( c );
            if( IsA( c, FuncExpr ) )
            {
                FuncExpr *func = (FuncExpr *) xpr;
                if( sm_is_xfunc( func ) )
                    return true; 
            }
        }
        return false;
    }
    else if( strcmp( fn, "octet_length" ) == 0 )
    {
        return true;
    }
    else
    {
    }

    return true;
}

bool
sm_has_xfunc( psc_private priv )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;
    ListCell *c;

    if( root->parse->havingQual )
    {
        List *l = ( List* )root->parse->havingQual;
        foreach( c, l )
        {
            Expr *expr = lfirst( c );

            if( IsA( expr, OpExpr ) )
            {
                OpExpr *x = (OpExpr*) expr;

                if( sm_opxpr_has_xfunc( x ) )
                    return true;
            }
        }

    }

    if( priv->L )
    {
        ListCell *c;
        foreach(c, priv->L )
        {   
            TargetEntry* tle = lfirst( c );


            if(tle ) // find one distinct col
            {   
                Expr*v = (Expr*) tle->expr;
                if( IsA( v, CaseExpr ) )
                {
                    return true;
                }
                else if( IsA( v, FuncExpr ) )
                {
                    if( sm_is_xfunc( (FuncExpr*) v ))
                        return true;
                }
                else if( IsA( v, Aggref ) )
                {
                    if( sm_aggref_has_xfunc( (Aggref*)v ) )
                        return true;    
                }
            }   
        }   
    }

    if( root->parent_root )
    {
        List *targetList;
        if( root->parent_root->parse )
        {
            ListCell *c;
            targetList = root->parent_root->parse->targetList;

            foreach(c, targetList )
            {   
                TargetEntry* tle = lfirst( c );


                if(tle ) // find one distinct col
                {   
                    Expr*v = (Expr*) tle->expr;
                    if( IsA( v, CaseExpr ) )
                    {
                        return true;
                    }
                    else if( IsA( v, FuncExpr ) )
                    {
                        if( sm_is_xfunc( (FuncExpr*) v ))
                            return true;
                    }

                }   
            }   
        }
    }

    if( root->parse->groupClause )
    {
        ListCell *l;
        foreach(l, root->parse->groupClause)
        {   
            TargetEntry* tle = 0;

            SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

            sp_get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList, &tle);

            if(tle ) // find one distinct col
            {   
                Expr*v = (Expr*) tle->expr;
                if( IsA( v, CaseExpr ) )
                {
                    return true;
                }
                else if( IsA( v, FuncExpr ) )
                {
                    if( sm_is_xfunc( (FuncExpr*) v ))
                        return true;
                }

            }   
        }   
    }


    if( baserel->baserestrictinfo )
    {
        ListCell *cell;

        foreach( cell, baserel->baserestrictinfo )
        {
            Expr * expr = ( Expr *) lfirst( cell ) ;

            if( expr->type == T_RestrictInfo )
            {
                    expr = (Expr*) ( ( RestrictInfo * ) lfirst ( cell ) )->clause;
            }

            if( IsA( expr, BoolExpr ) )
            {
                if( sm_boolxpr_has_xfunc( (BoolExpr*)expr ) )
                {
                    priv->tuple_limit = -1;
                    return true;
                }
            }
            else if( IsA( expr, OpExpr ) )
            {
                if( sm_opxpr_has_xfunc( (OpExpr*)expr ) )
                {
                    priv->tuple_limit = -1;
                    return true;
                }

            }
            else 
            {
                ;
            }
        }
    }

    return false;

}


bool
sm_boolxpr_has_xfunc( BoolExpr *bxpr )
{
    List *args = bxpr->args;
    ListCell *c;
    foreach( c, args )
    {
        Expr *expr = lfirst( c );
        if( IsA( expr, OpExpr ) )
        {
            OpExpr *opxpr = (OpExpr *)expr;
            if( sm_opxpr_has_xfunc( opxpr ) )
                return true;
        }
        if( IsA( expr, BoolExpr ) )
        {
            BoolExpr *blxpr = (BoolExpr*)expr;
            if( sm_boolxpr_has_xfunc( blxpr ) )
                return true;
        }
    }
    return false;
}

bool
sm_opxpr_has_xfunc( OpExpr *opxpr )
{
    const char *opf = get_func_name( opxpr->opfuncid );
    const char *opn = get_opname( opxpr->opno );

    List *l = opxpr->args;
    ListCell *c;

    foreach( c, l )
    {
        Expr *x = lfirst( c );

        if( IsA( x, OpExpr ) )
        {
           if( sm_opxpr_has_xfunc( (OpExpr*)x ) )
               return true;
        }
        else if( IsA( x, FuncExpr ) )
        {
            if( sm_is_xfunc( (FuncExpr*)x ) )
                return true;
        }
        else if( IsA(x , Var ) )
        {
            Var *v = ( Var *)x;
            if( strcmp( opf, "textcat" ) == 0 && v->vartype != TEXTOID )
                return true;
        }
        else if( IsA( x, CoerceViaIO ) )
        {
            CoerceViaIO *cvi = (CoerceViaIO*)x;
            Expr *expr = cvi->arg;

            if( strcmp( opf, "textcat" ) == 0 && cvi->resulttype != TEXTOID )
                return true;

            if( IsA( expr, Var ) )
            {
                Var *v = ( Var* ) expr;

                if( strcmp( opf, "textcat" ) == 0 && v->vartype != TEXTOID )
                    return true;
            }
        }
        else if( IsA( x, Param ) )
        {
           Param *p = (Param * )x ;
           if( p->paramkind == PARAM_EXEC)
           {
               return true;
           }
        }
    }
    return false;
}

void sm_project_coerce( psc_private priv, CoerceViaIO *cvi )
{
}

void sm_project_ab( psc_private priv, bson_t *mpb,  const char* key, const char *val )
{
    int rc = 0;
    char vfld[ NAMEDATALEN ] = {0};

    rc = BSON_APPEND_UTF8( mpb, key, sonar_prepend( vfld, val, "$" ) );
    ASSERT_BSON_OK( rc );
}

bool
sm_aggref_has_xfunc( Aggref *ag )
{
    List *args = ag->args;
    if( args )
    {
        ListCell *c;
        foreach( c, args )
        {
            Expr *expr = lfirst( c );
            if( IsA( expr, Aggref ) )
            {
                if( sm_aggref_has_xfunc( (Aggref*)expr ) )
                    return true;
            }
            else if( IsA( expr, FuncExpr ) )
            {
                if( sm_is_xfunc( expr ) )
                    return true;
            }
            else if( IsA( expr, TargetEntry ) )
            {
                TargetEntry *tle = (TargetEntry*)expr;
                Expr*v = (Expr*) tle->expr;

                if( IsA( v, CaseExpr ) )
                {
                    return true;
                }
                else if( IsA( v, FuncExpr ) )
                {
                    if( sm_is_xfunc( (FuncExpr*) v ))
                        return true;
                }
                else if( IsA( v, Aggref ) )
                {
                    if( sm_aggref_has_xfunc( (Aggref*)v ) )
                        return true;    
                }
                else if( IsA( v, CoerceViaIO ) )
                {
                    return true;
                }
            }
        }
    }
    return false;
}
