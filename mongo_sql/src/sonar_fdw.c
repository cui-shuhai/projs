
#include "sonar_utils.h"
#include "sonar_nm.h"
#include "sonar_log.h"
#include "sonar_join.h"
#include "sonar_outstretch.h"
#include "sonar_mis.h"
#include "sonar_bson.h"
#include "sonar_mongo.h"
#include "sonar_list.h"

#include "sonar_restriction.h"
#include "sonar_agg.h"
#include "sonar_xsub.h"
#include "sonar_group.h"
#include "sonar_query.h"
#include "sonar_distinct.h"
#include "sonar_order.h"
#include "sonar_path.h"
#include "sonar_option.h"


/* note: get_relid_attribute_name( foreigntableid, v->varattno ) fails with "Invalid cache" message
 * the problem is v->varattno is 0, that's illegal number, need fix. maybe yacc or bison etc error
 */

PG_MODULE_MAGIC;

extern bool sigint ;
extern const SonarOption SonarOptions[];

sighandler_t old_hdl; 

static BlockNumber PageCount(long collection_size);

Datum sonar_fdw_handler(PG_FUNCTION_ARGS);
Datum sonar_fdw_validator(PG_FUNCTION_ARGS);

PG_FUNCTION_INFO_V1(sonar_fdw_validator);

/*
 * SQL functions
 */


/*
 * FDW callback routines
 */
static void sonarGetForeignRelSize(PlannerInfo *root,
                          RelOptInfo *baserel,
                          Oid foreigntableid);
static void sonarGetForeignPaths(PlannerInfo *root,
                        RelOptInfo *baserel,
                        Oid foreigntableid);
static ForeignScan *sonarGetForeignPlan(PlannerInfo *root,
                       RelOptInfo *baserel,
                       Oid foreigntableid,
                       ForeignPath *best_path,
                       List *tlist,
                       List *scan_clauses);
static void sonarBeginForeignScan(ForeignScanState *node, int eflags);
static TupleTableSlot *sonarIterateForeignScan(ForeignScanState *node);
static void sonarReScanForeignScan(ForeignScanState *node);
static void sonarEndForeignScan(ForeignScanState *node);


static TupleTableSlot *sonarExecForeignInsert(EState *estate,
                          ResultRelInfo *resultRelInfo,
                          TupleTableSlot *slot,
                          TupleTableSlot *planSlot);

static int  sonarIsForeignRelUpdatable(Relation rel);

static void sonarExplainForeignScan(ForeignScanState *node,
                           ExplainState *es);


static List *sonarPlanForeignModify(PlannerInfo *root,
              ModifyTable *plan,
              Index resultRelation,
              int subplan_index);

static void sonarBeginForeignModify(ModifyTableState *mtstate,
               ResultRelInfo *resultRelInfo,
               List *fdw_private,
               int subplan_index,
               int eflags);
static void sonarEndForeignModify(EState *estate,
             ResultRelInfo *resultRelInfo);



Datum
sonar_fdw_validator(PG_FUNCTION_ARGS)
{
    List     *options = untransformRelOptions(PG_GETARG_DATUM(0));
    Oid     optionContextId = PG_GETARG_OID(1);
    ListCell *optionCell = NULL;

    int i;

    foreach(optionCell, options)
    {
        DefElem *optionDef = (DefElem *) lfirst(optionCell);
        char *optionName = optionDef->defname;
        bool valid = false;

        for (i = 0; SonarOptions[i].name; i++)
        {
            const SonarOption *opt = &(SonarOptions[i]);

            if ((optionContextId == opt->context) &&
                    (strncmp(optionName, opt->name, NAMEDATALEN) == 0))
            {
                valid = true;
                break;
            }
        }

        if (!valid)
            ereport(ERROR, (errcode(ERRCODE_FDW_INVALID_OPTION_NAME),errmsg("Bad option \"%s\"", optionName), errhint("Specify host and port")));
    }
    

    PG_RETURN_VOID();
}

/*
 * Foreign-data wrapper handler function: return a struct with pointers
 * to my callback routines.
 */
Datum
sonar_fdw_handler(PG_FUNCTION_ARGS)
{
    FdwRoutine *routine = makeNode(FdwRoutine);

    /* Functions for scanning foreign tables */
    routine->GetForeignRelSize = sonarGetForeignRelSize;
    routine->GetForeignPaths = sonarGetForeignPaths;
    routine->GetForeignPlan = sonarGetForeignPlan;
    routine->BeginForeignScan = sonarBeginForeignScan;
    routine->IterateForeignScan = sonarIterateForeignScan;
    routine->ReScanForeignScan = sonarReScanForeignScan;
    routine->EndForeignScan = sonarEndForeignScan;

    /* Functions for updating foreign tables */
    routine->PlanForeignModify = sonarPlanForeignModify;
    routine->BeginForeignModify = sonarBeginForeignModify;
    routine->ExecForeignInsert = sonarExecForeignInsert;
    routine->IsForeignRelUpdatable = sonarIsForeignRelUpdatable;
    routine->EndForeignModify=sonarEndForeignModify;

    /* Support functions for EXPLAIN */
    routine->ExplainForeignScan = sonarExplainForeignScan;

    PG_RETURN_POINTER(routine);
}


PG_FUNCTION_INFO_V1(sonar_fdw_handler);


/*
 * postgresGetForeignRelSize
 *      Estimate # of rows and width of the result of the scan
 *
 * We should consider the effect of all baserestrictinfo clauses here, but
 * not any join clauses.
 */
    static void
sonarGetForeignRelSize(PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid)
{
    SonarPlanState *fdw_private;
    double tupleCount=1;
    double rowSelectivity;
    double outputRowCount;

    sigint = false;

    sl_set_signal_handler( &old_hdl );

    so_init_planstate( root, baserel, foreigntableid );


    if( sigint )
        return;

    fdw_private = baserel->fdw_private;
    tupleCount = fdw_private->sizes.row_count;

    rowSelectivity = 1.0; 
    outputRowCount = clamp_row_est(tupleCount * rowSelectivity);
    baserel->rows = outputRowCount;

    if( root->hasJoinRTEs || so_implicit_join( root ) || ( root->parse->hasSubLinks == 0 &&  sj_is_join( root ) ) )
    {
        //sj_jns( root, baserel, foreigntableid); 
        //XXX using sorted result to make pg happy to apply merge join
        // since mongo can use index automatically, so there is no need to use index hint, this is cheaper
        sj_jns2( root, baserel, foreigntableid); 

        //merge join would be much better then nestloop in performance. so comment the following
        so_negociate_relsize( root, baserel );
    }

}


/*
 * Return the number of pages in a collection
 */

BlockNumber
PageCount(long collection_size)
{
    BlockNumber pages;
    pages = (collection_size + (BLCKSZ - 1)) / BLCKSZ;
    if (pages < 1)
        pages = 1;

     return pages;
}


/*
 * postgresGetForeignPaths
 *      Create possible scan paths for a scan on the foreign table
 */
static void
sonarGetForeignPaths(PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid)
{
    Path *foreignScanPath = NULL;
    PathKey *pk;
    List *pks = NULL;

    SonarPlanState *fdw_private = (SonarPlanState *)(baserel->fdw_private);


    BlockNumber pageCount = PageCount(fdw_private->sizes.raw_size);
    double tupleCount = fdw_private->sizes.row_count-fdw_private->sizes.first_row;


    double executionCost = (seq_page_cost * pageCount) +  (baserel->baserestrictcost.per_tuple * tupleCount);

    double startupCost = baserel->baserestrictcost.startup;
    double totalCost  = startupCost + executionCost;

    if( sigint )
        return;

    if( fdw_private->jns )
    {
        pk = sonar_create_pathkey( root );
        if( pk )
            pks = lcons( pk, pks );   
    }

/* create a foreign path node and add it as the only possible path */
    foreignScanPath = (Path *) create_foreignscan_path(root, baserel, baserel->rows,
            startupCost, totalCost,
            pks, /* ordering only for join, otherwise no known ordering */
            NULL, /* not parameterized */
            NIL); /* no fdw_private */

    add_path(baserel, foreignScanPath);
}


/*
 *      Create ForeignScan plan node which implements selected best path
 */
static ForeignScan *
sonarGetForeignPlan(PlannerInfo *root,
                     RelOptInfo *baserel,
                     Oid foreigntableid,
                     ForeignPath *best_path,
                     List *tlist,
                     List *scan_clauses)
{
    Index   scan_relid = baserel->relid;
    SonarPlanState *ps_priv = (SonarPlanState *)(baserel->fdw_private);
    psc_private priv = ps_priv->scan_priv;

    if( sigint )
        return 0;

    if( !priv ) 
        so_init_private( root, baserel, &priv);

    scan_clauses = extract_actual_clauses(scan_clauses, false);

    if( root->parse->jointree )
        root->join_search_private = sl_lappend( root->join_search_private, priv );
    /* Create the ForeignScan node */
    return make_foreignscan(tlist,
            scan_clauses,
            scan_relid,
            NIL,  /* no expressions to evaluate */
            list_make1( priv ));
}




/*
 * postgresBeginForeignScan
 *      Initiate an executor scan of a foreign PostgreSQL table.
 */
static void
sonarBeginForeignScan(ForeignScanState *scanState, int eflags)
{
    ForeignScan *fscan = NULL;
    ProjectionInfo *projInfo;
    psc_private priv ;

    if( sigint )
        return;

    fscan = (ForeignScan *) scanState->ss.ps.plan;
    projInfo = scanState->ss.ps.ps_ProjInfo;

    if( fscan->fdw_private == 0 )
        return;

    priv = lfirst( fscan->fdw_private->head );

    //so_build_restriction( scanState );
    scanState->fdw_state = priv;

    so_plan_scan( priv );

    //XXX update sql plan and generate mongo plan
    if (eflags & EXEC_FLAG_EXPLAIN_ONLY)
        return;

    if( priv->g )
        sl_log_query( priv->uri->collection_name, priv->g );

    if( priv->t == query_sonar_join )
    {
        if( priv->f )
            sl_log_query( priv->uri->collection_name, priv->f );
    }

    so_scan( priv, scanState );
   //so_remove_substr_qual( scanState );

    if( projInfo && projInfo->pi_lastScanVar )
        projInfo->pi_lastScanVar = priv->l->length;
}


/*
 * postgresIterateForeignScan
 *      Retrieve next row from the result set, or clear tuple slot to indicate
 *      EOF.
 */
static TupleTableSlot *
sonarIterateForeignScan(ForeignScanState *node)
{
    ForeignScan *scanstate = (ForeignScan *) node->ss.ps.plan;
    psc_private priv;

    if( ! scanstate->fdw_private ) 
        return 0;

    priv = lfirst( scanstate->fdw_private->head ); 

    if( sigint )
        return NULL;

    if( priv->t == query_regular )
    {
        return sq_iterate( node );
    }
    else if(  priv->t == query_distinct ) 
    {
        return sd_iterate( node );

    }
    else if( priv->t == query_aggregation )
    {
        // return result slot and exit next time with null
        return sa_iterate( node );
    }
    else if( priv->t == query_group )
    {
        return sg_iterate( node );
    }
    else if( priv->t == query_sonar_join )
    {
        return sj_iterate( node );
    }
    else if( priv->t == query_xsub )
    {
        return sx_iterate( node );
    }

    return NULL;
}


/*
 * postgresReScanForeignScan
 *      Restart the scan.
 */
static void
sonarReScanForeignScan(ForeignScanState *node)
{

    ForeignScan *fscan = NULL;
    psc_private priv;


    if( sigint )
        return;
   
    fscan = (ForeignScan *) node->ss.ps.plan;
    priv = lfirst( fscan->fdw_private->head );

    if( priv->t == query_sonar_join )
        return;

    sj_update_query( node, priv );

    sl_log_query( priv->uri->collection_name, priv->g );
    su_aggregate( priv );
}

/*
 * postgresEndForeignScan
 *      Finish scanning foreign table and dispose objects used for this scan
 */
static void
sonarEndForeignScan(ForeignScanState *node)
{
    ForeignScan *fscan = NULL;
    psc_private priv = node->fdw_state;

    fscan = (ForeignScan *) node->ss.ps.plan;

    // this happens query cancelled
    if( !priv )
        return;

    if( priv->uri->cursor )
    {
        mongoc_cursor_destroy( priv->uri->cursor );
        priv->uri->cursor = 0;
    }

    sm_close_node( priv->uri );
    priv->uri = 0;

    if( sigint )
    {
        sl_reset_signal_handler( old_hdl );
        sigint = false;
    }

    node->fdw_state = 0;

    if( priv )
    {

        if( priv->g )
        {
            bson_destroy( priv->g );
            priv->g = 0;
        }

        if( priv->gq )
        {
            bson_destroy( priv->gq );
            priv->gq = 0;
        }


        if( priv->t == query_group_end )
        {
            node->ss.ps.state->es_private =  0;
        }

        sonar_nm_release( priv );

        if( priv->jns )
        {
            ListCell *c;
            foreach( c, priv->jns )
            {
                JoinAttr ja = lfirst( c );
                if( ja->name )
                    free( (void*)ja->name );
                free( ja );
            }

            sl_list_free( priv->jns );
            priv->jns = 0;

        }

        if( priv->a )
        {
            if( priv->o )
            {
                bson_destroy( priv->o );
            }

            bson_destroy( priv->q );
            if( priv->f )
                bson_destroy( priv->f );
            if( priv->a )
                sl_list_free_deep( priv->a );
            sl_list_free_all( priv->l );
            sl_list_free_all( priv->L );
            list_free( fscan->fdw_private ); 
            priv->a = 0;
        }

        fscan->fdw_private = 0;

        free( priv );
        node->fdw_state = 0;
    }

}


/*
 * postgresExecForeignInsert
 *      Insert one row into a foreign table
 */
static TupleTableSlot *
sonarExecForeignInsert(EState *estate,
                          ResultRelInfo *resultRelInfo,
                          TupleTableSlot *slot,
                          TupleTableSlot *planSlot)
{
    int     n_rows;

    n_rows =  0; 

    /* Return NULL if nothing was inserted on the remote end */
    return (n_rows > 0) ? slot : NULL;

}



/*
 * postgresIsForeignRelUpdatable
 *      Determine whether a foreign table supports INSERT, UPDATE and/or
 *      DELETE.
 */
static int
sonarIsForeignRelUpdatable(Relation rel)
{
    return (1 << CMD_INSERT) /* | (1 << CMD_UPDATE) | (1 << CMD_DELETE) */ ;
}


static List *
sonarPlanForeignModify(PlannerInfo *root,
        ModifyTable *plan,
        Index resultRelation,
        int subplan_index)
{
    return 0;
}


static void
sonarBeginForeignModify(ModifyTableState *mtstate,
               ResultRelInfo *resultRelInfo,
               List *fdw_private,
               int subplan_index,
               int eflags)
{
}



static void
sonarEndForeignModify(EState *estate,
             ResultRelInfo *resultRelInfo)
{

}


/*
 * postgresExplainForeignScan
 *      Produce extra output for EXPLAIN of a ForeignScan on a foreign table
 */
static void
sonarExplainForeignScan(ForeignScanState *node, ExplainState *es)
{
    ForeignScan *fscan = NULL;
    psc_private priv;
    //List *l = 0; /* all interested field names */

    fscan = (ForeignScan *) node->ss.ps.plan;
    priv = lfirst( fscan->fdw_private->head );

    sq_explain( priv, es);
}


