/*
 * sonar_bson.h 
 * definition for bson_t object operations
 * APIs include query, modify, and append
 *
 * Created on: Tue Aug 26 11:45:36 PDT 2014
 * Author  CUI, Shu Hai
 * 
 */
#ifndef __SONAR_BSON_H__
#define __SONAR_BSON_H__

#define IF_MATH_OPERATOR( x )    \
if( ( x ) == SONA_ADD  ||  ( x ) == SONA_SUB  ||  ( x ) == SONA_MUL  ||  ( x ) == SONA_DIV || ( x ) == SONA_MDO )

typedef enum snop_id {
	SONA_LE,
	SONA_LT,
	SONA_GT,
	SONA_GE,
	SONA_EQ,
	SONA_NE,
	SONA_IN,
	SONA_ALL,
	SONA_RALL,
	SONA_BN,
	SONA_RX,
	SONA_IRX,
	SONA_NRX,
	SONA_INRX,
	SONA_NT,	/* NULL TEST */
	SONA_SA,
	SONA_MDO,
	SONA_MT,
	SONA_NM,
	SONA_ADD,
	SONA_SUB,
	SONA_MUL,
	SONA_DIV,
	SONA_CAT,
 	SONA_LAST,
} snop_id;


bool sb_append_xx( bson_t * b, snop_id opid,  const Const * const c );
bool sb_append_eq( bson_t * b, const char* name,  const Const * const c );
bool sb_append_eq2( bson_t * b, const char* name,  Oid pg_t, Datum d);

bool sb_append_in( bson_t *b, const Expr * const expr );
bool sb_append_bn( bson_t *b, const Expr * const expr );
bool sb_append_rx( bson_t *b, const Expr * const expr, bool insens );
bool sb_append_nx( bson_t *b, const Expr * const expr, const char* col_name, bool insens  );
bool sb_append_sa( bson_t *b, const Expr * const expr );
bool sb_append_md( bson_t *b, const  Const  *d, const Const * r );
bool sb_append_mt( bson_t *b, const Expr * const expr );
bool sb_append_nm( bson_t *b, const Expr * const expr );

bool sb_insert_eq( bson_t * b, const char * name, const Const * const c );
bool sb_insert_eq2( bson_t * b, const char* name,  Oid consttype, Datum constvalue);

bool sb_append_arr_eq( bson_t * b, const char* name,  const Const * const c );

bool sb_append_arr_all(
		bson_t * b,
		const Const * const c );

int sb_array_as_json(
		const bson_t * b,
		char ** buf ,
		Oid t);

int sb_array_as_json2(
		const bson_t * b,
		char ** buf,
		Oid t );

int sb_array_json(
		const bson_t * b,
		char ** buf,
		Oid t,
		const char *fld );

int sb_sprintf(
		char **buf,
		const char *format,
		... );

int sb_sprint_raw(
		char* *buf,
		const  bson_t *b,
		Oid t );

int sb_sprint(
		char ** buf,
		const bson_t *b,
		Oid t );

bool sb_all_one( const bson_t *b );
        

void sb_append_wild(
		 bson_t *b,
		 snop_id opid,
		 const Expr *expr,
         const Const *c );

#endif
