
#include "sonar_utils.h"
#include "sonar_list.h"
#include "sonar_path.h"

List * sj_keys( PlannerInfo *root, 
        RelOptInfo * baserel,
        Oid foreigntableid)
{
    List *jns = 0;
    RelOptInfo * tbr;
    
    if( root->hasJoinRTEs )
    {
        FromExpr * fxpr ;
        ListCell *c;

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
                    const char* opname = get_opname( oxpr->opno );

                    if(  !opname || strcmp( opname, "=" ) )
                    {
                       //continue; 
                    }

                    if( oxpr->args )
                    {
                        ListCell *vc;
                        foreach( vc, oxpr->args )
                        {
                            Expr *x = ( Expr * ) lfirst( vc );

                            if( IsA( x, Var ) )
                            {
                                Var *v = (Var*)x;
                                tbr = find_base_rel( root, v->varno );
                                if( tbr == baserel )
                                {
                                    char* n = get_attname( foreigntableid, v->varattno ) ;
                                    if( n )
                                    {
                                        jns = sl_lappend( jns, n ); 
                                    }

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
                                        char* n = get_attname( foreigntableid, v->varattno ) ;
                                        if( n )
                                        jns = sl_lappend( jns, n ); 

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return jns;
}

PathKey * sonar_create_pathkey( PlannerInfo *root )
{
    PathKey *pk = 0;
    FromExpr * fx = root->parse->jointree;

    if( fx )

    {
        ListCell *c;
        foreach( c, fx->fromlist )
        {
            Expr * x = lfirst( c );
            if( IsA( x, JoinExpr ) )
            {
                JoinExpr * jx = (JoinExpr * )x;
                if( jx->jointype == JOIN_INNER ) // may be good for all join types
                {
                    pk =  makeNode(PathKey);
                    if( root->eq_classes )
                    {
                        pk->pk_eclass = (EquivalenceClass*) root->eq_classes->head->data.ptr_value;
                        pk->pk_opfamily = pk->pk_eclass->ec_opfamilies->head->data.oid_value;
                    }

                    pk->pk_strategy = BTLessStrategyNumber; // 1 
                    pk->pk_nulls_first = true;
                }
            }
        }
    }

    return pk;
}
