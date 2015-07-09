
#include "sonar_utils.h"
#include "sonar_project.h"
#include "sonar_pg.h"
#include "sonar_log.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_restriction.h"
#include "sonar_group.h"
#include "sonar_order.h"

extern TargetEntry* get_sortgroupref_tle	(	Index	sortref, List *		targetList );

static bool order_field_aggregated( PlannerInfo *root,
                       SortGroupClause*sgc ,
                       psc_private priv );
/** implement mongo query orderby bson_t object
 * it cannot not be append or set separately as query, field do etc.
 * it needs to be put in aggregation command pipeline
 */
int so_order_bson( psc_private priv )
{
	int rc = false;
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;
    const char * collection_name = priv->uri->collection_name;

    bson_t sbd;
    TargetEntry *tle = 0;
    ListCell *l;

    priv->o = bson_new( );
    bson_init( priv->o );

    BSON_APPEND_DOCUMENT_BEGIN( priv->o, "$sort", &sbd );
    //BSON_APPEND_DOCUMENT_BEGIN( priv->o, "$sort", &sbd );

    //merge join hint happens here
    if( priv->jns )
    {
        ListCell *c;
        foreach( c, priv->jns )
        {
            JoinAttr ja = lfirst( c );
           
            BSON_APPEND_INT32(&sbd, priv->nm[ ja->index -1].sn, 1 );
        }
        bson_append_document_end( priv->o, &sbd );

        return true;
    }

    foreach(l, root->parse->sortClause)
    {
        SortGroupClause*sgc = (SortGroupClause *) lfirst(l);
        bool aggregated = order_field_aggregated( root, sgc, priv);

        tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

        if(tle ) // find one distinct col
        { Expr *expr = tle->expr;
            Var *v = 0;
            Aggref * agg = 0;
            const char * snn ;
            const char *operator;
            char fn[ NAMEDATALEN ] = {0};
            RelOptInfo *br = 0;

            if( IsA( expr, Var ) ) 
            {
                v = (Var*) tle->expr;
                br = find_base_rel( root, v->varno );
                if( br == baserel )
                {
                    snn= priv->nm[ v->varattno - 1].sn;

                    if( aggregated )
                    {
                        if( priv->t == query_distinct )
                        {
                            sprintf( fn, "_id.pscol%d", v->varattno );
                        }
                        else
                        {
                            sprintf( fn, "_id.pscol%d", tle->resno);
                        }
                    }
                    else
                    {
                        sprintf( fn, "%s", snn ); //sprintf( fn, "pscol%d", tle->resno );
                    }
                    operator = sonar_generate_operator_name( sgc->sortop, v->vartype, v->vartype );

                    if( strcmp( operator, "<" ) == 0 )
                        BSON_APPEND_INT32(&sbd, fn, 1 );
                    else if( strcmp( operator, ">" ) == 0 )
                        BSON_APPEND_INT32(&sbd, fn, -1 );

                    rc = true;
                }

            }
            else if( IsA( expr, Aggref ) )
            {
                if( priv->t == query_group )
                {

                    //TargetEntry* tlea; 
                    agg = ( Aggref * ) expr;
                    operator = sonar_generate_operator_name( sgc->sortop, agg->aggtype, agg->aggtype );

                    //tlea = sonar_get_alias( priv->L, agg );
                    
    //There is one weired case need fiigure how to sore
    // SELECT flightnum, avg( month ) from flights_mini_mongo GROUP BY flightnum ORDER BY count( dayofweek ); ? sort by what ? 

                    if( aggregated )
                    {
                        sprintf( fn, "_id.pscol%d", tle->resno );
                    }
                    else
                    {
                        sprintf( fn, "pscol%d", tle->resno );
                    }

                    if( strcmp( operator, "<" ) == 0 )
                        BSON_APPEND_INT32(&sbd, fn, 1 );
                    else if( strcmp( operator, ">" ) == 0 )
                        BSON_APPEND_INT32(&sbd, fn, -1 );
                    rc = true;
                }
            }
            else if( IsA( expr, FuncExpr ) )
            {
                FuncExpr* fxpr = (FuncExpr* ) expr;
                const char *fname = get_func_name( fxpr->funcid );

                if((  strcmp( fname, "substring" ) == 0  || strcmp( fname, "substring" ) == 0 ) && fxpr->args->length == 3 )
                {
                    Expr *x = lfirst( fxpr->args->head );
                    if( IsA( x, Var ) )
                    {
                        List *ll = 0;
                        char substr_fld[ NAMEDATALEN ] = {0};
                        char snn_fld[ NAMEDATALEN ] = {0};
                        Var *v = (Var*)x;

                        bson_t *b = bson_new();
                        int start  = ( ( Const * )lfirst( fxpr->args->head->next ) )->constvalue -1;
                        int len= ( ( Const * )lfirst( fxpr->args->head->next->next ) )->constvalue;

                        sprintf( substr_fld, "%s_%x", fname, fxpr->args );

                        sp_project_substr_restrict( priv, 0, &ll, fxpr );
                        //sp_project_substr( b, substr_fld,  priv->nm[ v->varattno -1].sn,  start, len );
                        //priv->projs0 = lappend( priv->projs0, b );

                        operator = sonar_generate_operator_name( sgc->sortop, fxpr->funcresulttype,  fxpr->funcresulttype );

                        if( strcmp( operator, "<" ) == 0 )
                            BSON_APPEND_INT32(&sbd, substr_fld, 1 );
                        else if( strcmp( operator, ">" ) == 0 )
                            BSON_APPEND_INT32(&sbd, substr_fld, -1 );
                        rc = true;

                        //should be something
                    } 
                    else if( IsA( x, CoerceViaIO ) )
                    {
                       CoerceViaIO *cvi = (CoerceViaIO*)x;

                       if( cvi->coerceformat == COERCE_EXPLICIT_CAST )
                       {
                           Expr *axpr = cvi->arg;

                           if( IsA( axpr, Aggref ) )
                           {
                               operator = sonar_generate_operator_name( sgc->sortop, TEXTOID, TEXTOID );
                               sprintf( fn, "substr_pscol%d", tle->resno );
                               if( strcmp( operator, "<" ) == 0 )
                                   BSON_APPEND_INT32(&sbd, fn, 1 );
                               if( strcmp( operator, ">" ) == 0 )
                                   BSON_APPEND_INT32(&sbd, fn, -1 );
                                rc = true;
                           }
                        }
                     }
                 }
            }
            else if( IsA( expr, OpExpr ) )
            {
                OpExpr *opxpr = (OpExpr*) expr;

               operator = sonar_generate_operator_name( sgc->sortop, opxpr->opresulttype,  opxpr->opresulttype );
               rc =  so_order_byopxpr( priv, &sbd, opxpr, operator );
            }
        }

	}

    bson_append_document_end( priv->o, &sbd );
	return rc;
}

bool order_field_aggregated( PlannerInfo *root,
                       SortGroupClause*sg ,
                       psc_private priv )
{
    bool rc = false;
    TargetEntry* te= get_sortgroupref_tle(sg->tleSortGroupRef, root->parse->targetList);
    //Create group variable
    if( root->parse->groupClause )
    {
        ListCell *l;

        foreach(l, root->parse->groupClause)
        {   
            SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

            TargetEntry* tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

            if(tle && tle->resname && te->resname) // find one distinct col
            {   
                if( strcmp( te->resname, tle->resname ) == 0 )
                {
                    rc = true;
                    break;
                }
            }   
        }   

    }
    else if( root->parse->distinctClause )
    {
        ListCell *l;

        foreach(l, root->parse->distinctClause)
        {   
            SortGroupClause*sgc = (SortGroupClause *) lfirst(l);

            TargetEntry* tle= get_sortgroupref_tle(sgc->tleSortGroupRef, root->parse->targetList);

            if(tle && tle->resname && te->resname) // find one distinct col
            {   
                if( strcmp( te->resname, tle->resname ) == 0 )
                {
                    rc = true;
                    break;
                }
            }   
        }   

    }

    return rc;

}

bool
so_order_byopxpr( psc_private priv, bson_t *b,  OpExpr *opxpr, const char *operator )
{
    bool rc = false;
    const char *opname = get_func_name( opxpr->opfuncid );
    List *args = opxpr->args;
    
    if( strcmp( opname, "textcat" ) == 0 )
    {
        Expr *x1 = lfirst( args->head );
        Expr *x2 = lfirst( args->head->next );

        if( IsA( x1, Var ) && IsA( x2, Var ) )
        {
            bson_t bs;
            bson_t ba;
            bson_t *project = bson_new();
            char catfld[ NAMEDATALEN ] = {0};
            char field[ NAMEDATALEN ] = {0};

            Var *v1 = (Var*) x1;
            Var *v2 = (Var*) x2;

            sprintf( catfld, "%s_%x", opname, opxpr->args );

           if( strcmp( operator, "<" ) == 0 )
               BSON_APPEND_INT32(b, catfld, 1 );
           if( strcmp( operator, ">" ) == 0 )
               BSON_APPEND_INT32(b, catfld, -1 );

            rc = true;
            //XXX append field projection

            BSON_APPEND_DOCUMENT_BEGIN( project, catfld, &bs );
            BSON_APPEND_ARRAY_BEGIN( &bs, "$concat", &ba );
            BSON_APPEND_UTF8( &ba, "0",  sonar_prepend( field, priv->nm[ v1->varattno -1].sn, "$" ) );
            memset( field, 0, NAMEDATALEN );

            BSON_APPEND_UTF8( &ba, "1",  sonar_prepend( field, priv->nm[ v2->varattno -1].sn, "$" ) );
            bson_append_array_end( &bs, &ba );
            bson_append_document_end( project, &bs );

            priv->projs0 = sl_lappend( priv->projs0, project );

        }
    }

    return rc;
}
