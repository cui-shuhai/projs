
#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_nm.h"
#include "sonar_mis.h"

#include "sonar_restriction.h"
#include "sonar_agg.h"
#include "sonar_group.h"
#include "sonar_distinct.h"
#include "sonar_query.h"
#include "sonar_subquery.h"
#include "sonar_order.h"
#include "sonar_join.h"
#include "sonar_option.h"
#include "sonar_outstretch.h"


const void * so_copy_self( const SonarPrivate * from )
{
    return from;
}

void so_init_private( PlannerInfo *root,
                     RelOptInfo *baserel,
                     psc_private *ppriv )
{
    SonarPlanState *fdw_private = (SonarPlanState *)(baserel->fdw_private);

    if( IsA( fdw_private, SonarPlanState ) )
    {
        if( fdw_private && fdw_private->scan_priv == 0 )
        {
            psc_private priv;

            if ( ! (*ppriv = makeSonarNode( SonarPrivate )) )
                return; 

            priv = *ppriv;

            priv->id = fdw_private->id;

            priv->copy_self = so_copy_self;
            priv->root = root;
            priv->baserel = baserel;


            priv->q = bson_new( );
            priv->o = 0;

            if( !priv->q )
             return;

            fdw_private->scan_priv = priv;

            su_move_copy((void**) &fdw_private->jns, (void**)&priv->jns );
            su_move_copy( (void**)&fdw_private->uri, (void**)&priv->uri );

            priv->L = sl_tle_list_copy(root->parse->targetList);

            sn_build_nm( priv );

            priv->t = sm_query_type( root, baserel, priv );

            sn_collect_interests( priv );

            if( priv->t == query_group && priv->L )
            {
                priv->projs0 = malloc( priv->L->length * sizeof( List * ) );
                memset( priv->projs0, 0,  priv->L->length * sizeof( List * ) );
                priv->projs1 = malloc( priv->L->length * sizeof( List * ) );
                memset( priv->projs1, 0, priv->L->length * sizeof( List * ) );

                sg_mark_group_tle( priv );
            }

            if( priv->tuple_limit != -1 && ! (root->parse->groupClause && priv->t == query_regular ) && !sj_is_join( root ) )
            {
                so_limitcount( priv );

                so_limitoffset( priv );
            }


            //if( priv->t != query_sonar_join ) //  && priv->t != query_group )
            sq_fields( priv );

            if( !priv->f )
                priv->f = bson_new();


            //if( root->parse->sortClause && !sj_is_join( root ))
            {
                if( !so_order_bson( priv ) ) 
                {
                    bson_destroy( priv->o );
                    priv->o = 0;
                }
            }

            bson_init( priv->q );

            // build query bson_t object SQL where clause
            if( baserel->baserestrictinfo )
            {
                sr_expr( 
                     priv,
                     baserel->baserestrictinfo,
                     priv->q,
                     false,
                     NULL,
                     true,
                     0,
                     true );
            }
            else if( root->parse->jointree && priv->t != query_sonar_join && priv->t != query_xsub )
            {
                sr_jointree_expr(
                    priv,
                    0,
                    priv->q,
                    false,
                    0,
                    (Expr*)root->parse->jointree,
                    false,
                    0);
            }
        }
        else if( fdw_private )
        {
            *ppriv = fdw_private->scan_priv;
        }
        else
        {
            *ppriv = 0;
        }
    }
    else if( IsA( fdw_private, SonarPrivate ) )
    {
        *ppriv = fdw_private;
    }
}


void so_plan_scan_priv( psc_private priv, Var* v, Datum d )
{
    switch( priv->t )
    {
        case query_regular :
        {
            sq_plan_scan( priv, v, d );
            break;
        }
        case query_group : //GROUP BY, HAVING
        {
            sg_plan_scan( priv, v, d );
            break; 
        }
        case query_aggregation :
        {
            sa_plan_scan( priv, v, d );
            break; 
        }
        case query_distinct :
        {
          sd_plan_scan( priv, v, d );
            break; 
        }
        case query_sonar_join :
        {
          sj_plan_scan( priv );
            break; 
        }
        case query_xsub:
        {
            sx_plan_scan( priv );
            break;
        }
        default:
           sl_log( FATAL, "plan scan faield", "unknown query type" );
    }

}

void so_plan_rescan_priv( psc_private priv, Var* v, Datum d )
{
    switch( priv->t )
    {
        case query_regular :
        {
            sq_plan_rescan( priv, v, d );
            break;
        }
        case query_group : //GROUP BY, HAVING
        {
            sg_plan_rescan( priv, v, d );
            break; 
        }
        case query_aggregation :
        {
            sa_plan_rescan( priv, v, d );
            break; 
        }
        case query_distinct :
        {
          sd_plan_rescan( priv, v, d );
            break; 
        }
        default:
           sl_log( FATAL, "plan scan faield", "unknown query type" );
    }

}

void so_plan_rescan2_priv( psc_private priv, Param* p, Const *c)
{
    Var *v = sp_find_var( priv->root, p);
    Datum d = c->constvalue;

    so_plan_rescan_priv( priv, v, d );
}

void so_plan_scan( psc_private priv )
{
    so_plan_scan_priv( priv, 0, 0 );
}

void so_scan( psc_private priv, ForeignScanState *ss )
{
    RelOptInfo *baserel = priv->baserel;

    if( priv->t == query_group || priv->t == query_aggregation  )
            ss->ss.ps.state->es_private = ( ResultRelInfo *)  priv ;

    if(priv->t == query_sonar_join || priv->t == query_xsub)
            ss->ss.ps.state->es_private = ( ResultRelInfo *)  priv ;

    so_scan_priv( priv );

    if( baserel->fdw_private )
    {
        free( baserel->fdw_private );
        baserel->fdw_private = priv;
    }
     //RegisterTimeout( STARTUP_PACKET_TIMEOUT, SIG_IGN );

}

void
so_negociate_relsize(PlannerInfo *root,
        RelOptInfo *baserel )
{
    int i = 0;
    RelOptInfo *jrel = 0;

    //if( root->simple_rel_array_size > 3 )
        //return;

    for( i = 1; i < root->simple_rel_array_size; i++ )
    {
        jrel = root->simple_rel_array[ i ];

        if( jrel == 0 )
            continue;

        if( jrel != baserel && jrel->fdw_private )
         {
            SonarPlanState *self = baserel->fdw_private;
            SonarPlanState *jps = jrel->fdw_private;
            if( self->sizes.row_count == jps->sizes.row_count )
            {
                self->sizes.row_count += i*10;
                baserel->rows += i*10;
            }
#if 0  //XXX this part is for forcing Nestloop join
            if( self->sizes.row_count < jps->sizes.row_count )
             {
                 baserel->rows = 1;
                 jrel->rows = 2;
                 return;
             }
             else
             {
                 jrel->rows = 1;
                 baserel->rows = 2;
                if( self->sizes.row_count == jps->sizes.row_count )
                {
                    self->sizes.row_count += 1;
                }
                 return;
             }
#endif
            
         }
    }
}

bool so_implicit_join( PlannerInfo *root )
{
    if( root->parse->jointree )
    {
        FromExpr * fxpr = ( FromExpr*) root->parse->jointree;

        if( fxpr->fromlist->length ==2 )
        {
            RangeTblRef *rtr1 = lfirst( fxpr->fromlist->head );
            RangeTblRef *rtr2 = lfirst( fxpr->fromlist->head->next );

            return ( IsA( rtr1, RangeTblRef ) && IsA( rtr2, RangeTblRef ) );
        }
    }

    return false;
}

void so_init_planstate( 
        PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid)
{
    if(  ! baserel->fdw_private )
    {
        SonarPlanState *fdw_private;

        fdw_private = (SonarPlanState *) makeSonarNode( SonarPlanState );
            //memset( fdw_private, 0, sizeof(SonarPlanState));
        baserel->fdw_private = (void *) fdw_private;

        fdw_private->sizes.first_row = 0;
        fdw_private->id = foreigntableid;

        fdw_private->uri = malloc( sizeof( *fdw_private->uri ) );

        memset( fdw_private->uri, 0, sizeof( *fdw_private->uri ) );

        if( so_connect_extern( fdw_private ) == 0 )
        {
            sm_collection_sizes( root, baserel, foreigntableid );
        }
    }
}

int so_connect_extern( SonarPlanState *ps_priv )
{
    //struct timeval timeout;
    const char* authmod = sonar_get_authmode( ps_priv->id);
    const char* usr = sonar_get_usr( ps_priv->id);

    const char *pwd = sonar_get_pwd( ps_priv->id);

    strncpy( ps_priv->uri->db_name, sonar_get_mdb( ps_priv->id ), NAMEDATALEN) ;
    strncpy(ps_priv->uri->collection_name, sonar_get_collection( ps_priv->id ),NAMEDATALEN);

    strncpy( ps_priv->uri->host, sonar_get_host( ps_priv->id),NAMEDATALEN);
    if( authmod )
        strncpy( ps_priv->uri->authmod, authmod,NAMEDATALEN);
    if( usr )
        strncpy( ps_priv->uri->usr, usr,NAMEDATALEN);
    if( pwd )
        strncpy( ps_priv->uri->pwd, pwd, NAMEDATALEN);

    ps_priv->uri->port = sonar_get_port( ps_priv->id );



    so_init_node( ps_priv );

     //timeout.tv_sec =  7 * 24 * 3600UL;
     //timeout.tv_usec = 0;

    //sm_setsockopt( ps_priv->uri, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof timeout );

    return 0;
    
}

void so_init_node( SonarPlanState *ps_priv )
{

    mongoc_init();

    if( !ps_priv->uri->uri )
    {
        if( !(ps_priv->uri->uri = sm_create_auth_uri( ps_priv->uri ) ) )
            ps_priv->uri->uri = sm_create_uri( ps_priv->uri );
    }

    if( !ps_priv->uri->uri )
    {
        sl_log( INFO, "so_init_node", "failed to create mongoc uri\n");
    }

    if( !ps_priv->uri->client )
    {
        int timeo = sonar_get_conn_timeout( ps_priv->id );
        ps_priv->uri->client = sm_connect( ps_priv->uri->uri, timeo );
    }

    if( !ps_priv->uri->collection )
        ps_priv->uri->collection = mongoc_client_get_collection(ps_priv-> uri->client, ps_priv->uri->db_name, ps_priv->uri->collection_name );
}

void 
so_scan_priv( psc_private priv )
{
    switch( priv->t )
    {
        case query_group : //GROUP BY, HAVING
        {
            sg_scan( priv );
            break; 
        }
        case query_aggregation :
        {
            sa_scan( priv );
            break; 
        }
        case query_distinct :
        {
            sd_scan( priv );
            break; 
        }
        case query_sonar_join :
        {
            sj_scan( priv );
            break; 
        }
        case query_xsub :
        {
            sx_scan( priv );
            break; 
        }
        case query_regular :
        {
            sq_scan( priv );
            break; 
        }
        default:
            sl_log( INFO, "so_scan_priv", "invalid query type");
    }
}


void so_limitoffset( psc_private priv )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;

    if( root->parse->limitOffset )
    {
        if( !ss_is_subquery( root, baserel, priv ) )
        {
            priv->tuple_offset =  DatumGetInt64( ((Const*)root->parse->limitOffset)->constvalue );
            root->parse->limitOffset = 0;
        }
        else if( root->query_level > 1 && root->parent_root )
        {
            priv->tuple_offset =  DatumGetInt64( ((Const*)root->parse->limitOffset)->constvalue );
            root->parse->limitOffset = 0;
        }
    }
}

void so_limitcount( psc_private priv )
{
    PlannerInfo *root = priv->root;
    RelOptInfo *baserel = priv->baserel;

    if( baserel->tuples )
    {
        priv->tuple_limit = baserel->tuples; 
    }
    else if( root->parse->limitCount )
    {
        if( !ss_is_subquery( root, baserel, priv )  )
        {
            priv->tuple_limit = DatumGetInt64( ((Const*)root->parse->limitCount)->constvalue );
        }
        else if( root->query_level > 1 && root->parent_root )
        {
            priv->tuple_limit =  DatumGetInt64( ((Const*)root->parse->limitCount)->constvalue );
        }
    }
}

//XXX for unkonwn issue, postgres doesn't like like substr
// or it has bug, remove substr qual 1. makes postgres happy, 2. improves performance

void so_remove_substr_qual( ForeignScanState *ss )
{
    List *l = ss->ss.ps.qual;
    ListCell *c;

    foreach( c, l )
    {
        FuncExprState * funcstate = (FuncExprState*)lfirst( c );
        if( IsA( funcstate, FuncExprState ) )
        {
            OpExpr *opexpr = ( OpExpr * )funcstate->xprstate.expr;
            if( IsA( opexpr, OpExpr ) )
            {
                ListCell *arg;
                foreach( arg, opexpr->args )
                {
                    FuncExpr *fnxpr = (FuncExpr*) lfirst( arg );
                    if( IsA( fnxpr, FuncExpr ) )
                    {
                        const char *fname = get_func_name( fnxpr->funcid );
                        if( strcmp( fname, "substr" ) == 0 )
                        {
                             ss->ss.ps.qual = list_delete( l, funcstate );
                        }

                    }
                }
            }
        }
    }
}
