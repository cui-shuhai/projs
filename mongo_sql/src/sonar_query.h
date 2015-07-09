#ifndef __SONAR_QUERY_H__
#define __SONAR_QUERY_H__


typedef struct _sonar_mongoc_cursor_t
{
    mongoc_client_t           *client;

    uint32_t                   hint;
    uint32_t                   stamp;

    unsigned                   is_command   : 1;
    unsigned                   sent         : 1;
    unsigned                   done         : 1;
    unsigned                   failed       : 1;
    unsigned                   end_of_event : 1;
    unsigned                   in_exhaust   : 1;
    unsigned                   redir_primary: 1;
    unsigned                   has_fields   : 1;

    bson_t                     query;
    bson_t                     fields;

    mongoc_read_prefs_t       *read_prefs;

    mongoc_query_flags_t       flags;
    uint32_t                   skip;
    uint32_t                   limit;
    uint32_t                   count;
    uint32_t                   batch_size;

    char                       ns [140];
    uint32_t                   nslen;

    bson_error_t               error;

} sonar_cursor;

bool 
sq_plan_scan( psc_private  priv, Var* v, Datum d );

bool
sq_plan_rescan( psc_private  priv, Var* v, Datum d );

bool 
sq_explain( psc_private priv , ExplainState *es);

/** 
 * Begin Foreign Scan for QueryQuery 
 */
void
sq_scan( psc_private priv );

bson_t * sq_fields( psc_private priv );
bson_t * sq_fields2( psc_private priv );

bool sq_json_field( psc_private priv, Var *v, char *fld );

/** 
 * sonarIteratorForeignScan processing for DISTINCT query
 */
TupleTableSlot *
sq_iterate(ForeignScanState *node );

bool sq_append_eq_unwind( psc_private priv, bson_t * b, Var* v,  const Const * const c );
bool sq_append_eq_unwind2( psc_private priv, bson_t * b, Var* v,  const Const * const c );

void sq_pipeline_unwind( psc_private priv, array_unit *au, bson_t *pipe );

void sq_unify_mp( psc_private priv, List *lpp, List **list );
#endif
