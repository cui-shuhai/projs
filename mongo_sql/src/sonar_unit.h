#ifndef __SONAR_UNIT_H__
#define __SONAR_UNIT_H__


#include "mongoc.h"
#include "bson.h"


#ifndef MAXOPNAMELEN 
#define MAXOPNAMELEN 11
#endif


#define ASSERT_BSON_OK( x )    if( (x) == false ) { \
    ereport(LOG, ( errcode(ERRCODE_FDW_UNABLE_TO_CREATE_REPLY ),errmsg(" bson operation failed" ), errhint("%s:  %d: return code : %d", __func__, __LINE__, x )));  \
}

/* * sonar_bson_append.c 
 *  basic sonar utils api, for spliting sonar_utils file
 * Mon May  5 16:03:50 PDT 2014
 * SHU HAI CUI
 */


/** json and SQL operators maps:
*	they are not exactly 1 - 1 way,
*	so we need define some jsonsar specific operators 
*	for mapping some SQL opeartors. 
*	---adding more later
*/ 

typedef struct pgsn_operator_map
{ 
	int idx;
	const char * pg_op;
	const char *sn_op;
} pgsn_operator_map;

typedef struct _sonar_pair_t{
    void *k;
    void *v;
} su_pair_t, *su_pair;

extern pgsn_operator_map OpMap[];

const  enum snop_id
su_sop_from_pg(const char *opname);

const char * 
snopname_from_pg(const char *opname);


typedef enum json_string_condition
{
	JS_KEY_START,
	JS_KEY_END,
	JS_VAL_START,
	JS_VAL_END,
	JS_NUDE_VAL_START,
	JS_NUDE_VAL_END,
	JS_COMMA,
	JS_COLON,
	JS_DIGIT,
	JS_ARRAY_START,
	JS_ARRAY_END,
	JS_DOC_START,
	JS_DOC_END,
	JS_IN_QUOTE,
	JS_INVALID
} current_json_status;

typedef struct  bson_array_idx{
	int idx;
	char buf[8];
}array_unit;

bool su_cook_for_print( char * str, char** cs);
char * sonar_prepend( char * d, const char * s, const char * prefix );

const char * array_index( array_unit * au );
void m2oidstr( const char * const si , char *so );


bool sonar_var_in_list( List * l, Var* v );
bool sonar_attr_node_exist( List * l, int i );
List * sonar_append_attr_node( List * l, int i, const char * n);

void su_move_copy( void ** l, void **r );
void su_namecpy( char *d, const char * s );
void su_update_name( char *s );

//caller's responsibility to make sure listcell is pointer
void * list_nth_node( List *l, int n );
void su_bson_list_free( List *l );

bool su_name_cover( const char *n1, const char * n2 );

#endif
