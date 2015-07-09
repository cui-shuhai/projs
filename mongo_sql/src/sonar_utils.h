/*
 * sonar_utils.h
 *
 *  Created on: Aug 2, 2013
 *      Author: ury
 */

#ifndef SONAR_UTILS_H_
#define SONAR_UTILS_H_

#include "postgres.h"

#include <sys/fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>

#include "utils/palloc.h"
#include "utils/hsearch.h"
#include "utils/rel.h"
#include "utils/numeric.h"
#include "utils/timestamp.h"
#include "utils/date.h"
#include "utils/datetime.h"


#include "access/htup_details.h"
#include "access/sysattr.h"
#include "access/reloptions.h"
#include "commands/defrem.h"
#include "commands/explain.h"
#include "commands/vacuum.h"
#include "commands/dbcommands.h"
#include "foreign/fdwapi.h"
#include "foreign/foreign.h"
#include "funcapi.h"
#include "miscadmin.h"
#include "nodes/nodes.h"
#include "nodes/pg_list.h"
#include "nodes/makefuncs.h"
#include "nodes/nodeFuncs.h"
#include "nodes/primnodes.h"
#include "optimizer/cost.h"
#include "optimizer/pathnode.h"
#include "optimizer/paths.h"
#include "optimizer/planmain.h"
#include "optimizer/prep.h"
#include "optimizer/restrictinfo.h"
#include "optimizer/var.h"
#include "optimizer/tlist.h"
#include "parser/parsetree.h"
#include "parser/parse_oper.h"
#include "utils/builtins.h"
#include "utils/timeout.h"
#include "utils/guc.h"
#include "utils/lsyscache.h"
#include "utils/memutils.h"
#include "utils/rel.h"
#include "utils/hsearch.h"
#include "utils/syscache.h"
#include "catalog/pg_foreign_server.h"
#include "catalog/pg_foreign_table.h"
#include "catalog/pg_user_mapping.h"
#include "catalog/pg_operator.h"

#include "bson.h"
#include "mongoc.h"

#include "sonar_pg.h"
#include "sonar_bson.h"
#include "sonar_mongo.h"
#include "sonar_unit.h"

#define SONAR_PORT 27117

#define NM_HASH_SIZE ( 256 )


#define POSTGRES_TO_UNIX_EPOCH_DAYS (POSTGRES_EPOCH_JDATE - UNIX_EPOCH_JDATE)
#define POSTGRES_TO_UNIX_EPOCH_USECS (POSTGRES_TO_UNIX_EPOCH_DAYS * USECS_PER_DAY)
#define PGUNIX_TSDIFF   (POSTGRES_TO_UNIX_EPOCH_DAYS * USECS_PER_DAY) // 946684800000000UL 

#define  MAX_BSON_DOC_SIZE   ( 1024 * 1000 )
#define  SONAR_IN_ARRAY_SIZE  ( 1024 * 1000 ) 

#define SU_DATUM( pg_t, bson_type )    pg_t ## GetDatum( bson_iter_ ## bson_type( i ) )
#define FORCE_BSON_DATUM( name, bson_type )  

#define SU_BSON_VAL( it )    v = bson_iter_value( it ) 
#define SU_VAL_TYPE( v )   t = v->value_type; 
#define SU_TYPE_VAL( t )    v->value.v_  ## t
#define SU_TYPE_STR( t )    v-> value.v_ ## t.str
#define SU_TYPE_TSTR( t )    v-> value.v_ ## t.t
            

typedef uint32_t stringlen_t;
typedef uint64_t document_id_t; //< ID of a JSON/BSON/etc document

typedef struct partial_mongoc_cursor_t
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
} PARTIAL_CURSOR;


typedef enum sonar_bon_search_result
{
	SBSR_NO = 0,
	SBSR_FOUND,
	SBSR_END
} enum_ss;

typedef enum sql_query_enum
{
	query_regular = 0,
	query_distinct ,
	query_aggregation ,
	query_group,
	query_group_end,
	query_sonar_join,
	query_xsub,
	query_invalid = -1,
} query_enum;


typedef struct Sonar_Sizes {
	int64_t first_row;
	int64_t row_count;
	int64_t column_count;
	int64_t raw_size;
	bson_t *sonar_query_bson;
} Sonar_Sizes ;

typedef struct Sonar_pg_Map{
	char  pn[NAMEDATALEN];
    char  sn[NAMEDATALEN];
	const char  *ap; //array parent for unwind
} SpnmData, *Spnm;

typedef struct sql_join_field{
    const char *name;
    int index;
} JoinAttrData, *JoinAttr;

typedef struct scan_private_tag
{
    Node type;
    const void * ( *copy_self )( const  struct scan_private_tag * );
    Oid  id;  //table id
	bson_t *q;  // query bson_t
	bson_t *gq;  // query bson_t for grouged constrictions
	bson_t *f;  // fields bson_t
	bson_t *o;  // order by bson, not option for aggregate ( this is NULL )
	List *l;  // targetlist 
	List *a;  // aggregation query list
    List *jns; // join feild attrs 
	query_enum t; // query type
	int tuple_limit;
	int64 tuple_offset;
	List *L;  // targetList 
    Spnm  nm;
    bson_t *g;  // group by aggregation result
    bson_iter_t *it;
    TupleDesc ttsdesc;
    TupleTableSlot * ( *fn )( void * );
    void * root;
    void * baserel;
    smp_node_uri uri;
    List *projs;  //map projections: where, having etc. for group by query, should be only where
    List **projs0;  //map projections: mapps for functions or functions previous to aggregation functions. It is List *[]
    List **projs1;  //map projections: mapps for functions as arguments of  aggregation functions. It is List *[]
    void * js;
    unsigned int jpos; // baserel join position 0. no join, 1 on lift, 2 on right, 3 middle
    unsigned  sonardb_flag : 1;
    unsigned  where_map_flag : 1;
    unsigned  x1_flag : 1;
    unsigned  x2_flag : 1;
    unsigned  x3_flag : 1;
    unsigned  x4_flag : 1;
    unsigned  x5_flag : 1;
    unsigned  x6_flag : 1;

} sc_private, SonarPrivate,  *psc_private;


typedef struct SonarPlanState {
    Node type;
    Oid  id;  //table id
	Sonar_Sizes sizes;
    List *jns;  //join field attributrs
    void *scan_priv;
    smp_node_uri uri;
} SonarPlanState ;




bool su_mongo_pg_map( const  bson_t* bs, TupleTableSlot *tts, int col, const char *n );

bool su_mp_descend_map( const  bson_t* bs, TupleTableSlot *tts, int col, const char *snn );

bool su_init_slot( bson_iter_t* i, TupleTableSlot *tts, int col );


Datum datum_from_cstring( TupleTableSlot *tts, int i,  const char * v );

int  sonar_bson_array( const bson_t *b , char *s,  int l );
Datum col_from_cstr( TupleTableSlot* tts, int i,  const char * v );

int  sonar_bson_to_json( const bson_t *b , char *s,  int l );

Var* sonar_copy_var ( const Var * from ); 
void sonar_append_targetvar( const psc_private p, const Var * v );

void su_aggregate( const psc_private priv );

void su_query( const psc_private p );


Numeric su_int64_to_numeric 	( 	int64  	v	);

Numeric sp_float8_to_numeric( float8	v );

Expr *get_arg_by_type(List *, NodeTag );

TargetEntry*  sonar_get_alias( List *l, void * a );

Numeric su_int64_to_numeric 	( 	int64  	v	);

Numeric su_float8_to_numeric( float8	v );

void
su_push_doc_in_array( bson_t *a, array_unit * i, bson_t *d );
void
su_push_docval_in_array( bson_t *a, array_unit * i, const char * n, bson_t *d );

void
su_push_unwind_in_array( bson_t *a, array_unit * i, const char * fld );

void
su_push_bsonval_in_array(
		 bson_t * to,
		 array_unit * i,
		 const char * n,
		 const bson_t *from );

int
su_push_distinct_in_array(
		 bson_t * to,
		 array_unit * i,
		 const char * n,
		 const bson_t *from,
         bson_t **last );

void su_target_json_field( 
        psc_private priv,
        TargetEntry *e,
        char *fld );

bool su_var_grouped(psc_private priv,
                    Var * v,
                    TargetEntry **pp );

bool su_sonardb(PlannerInfo *root,
                RelOptInfo *baserel,
                psc_private priv);

bool
su_it_tts( bson_iter_t* it, TupleTableSlot *tts, int col );

psc_private su_find_private(PlannerInfo *root,
                            int idx,
                            psc_private *priv);

const char* su_primitive_bson( bson_type_t t, bson_value_t *v );

#endif /* SONAR_UTILS_H_ */

