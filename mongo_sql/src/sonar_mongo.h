/*
 * sonar_mongo.h
 * These API definitons for getting  mongo collection attributes 
 * 
 *  Create on: Tue Sep  2 10:11:18 PDT 2014
 *  Author: CUI, Shu Hai
 */

#ifndef __SONAR_MONGO_H__
#define __SONAR_MONGO_H__

typedef struct sonar_db_node{ 
     char host[NAMEDATALEN];
     uint16_t port;
     char db_name[NAMEDATALEN];
     char collection_name[NAMEDATALEN];
     char authmod[ NAMEDATALEN ];
     char usr[NAMEDATALEN];
     char pwd[NAMEDATALEN];
     mongoc_uri_t *uri;
     mongoc_client_t *client;
     mongoc_collection_t *collection;
     mongoc_cursor_t *cursor;
 } sm_node_uri, *smp_node_uri;


mongoc_uri_t * sm_create_uri( smp_node_uri suri );

mongoc_uri_t * sm_create_auth_uri( smp_node_uri suri );


void sm_close_node( smp_node_uri uri );

mongoc_client_t *sm_connect(const mongoc_uri_t *uri, int timeo );

void sm_close( mongoc_client_t *client ); 

void sm_query(  smp_node_uri uri,
	 uint32_t skip,
	 uint32_t limit,
	 const bson_t *query,
	 const bson_t *fields );

void sm_query_db( smp_node_uri uri, 
     const char *db_name,
     const char *collection_name,
	 uint32_t skip,
	 uint32_t limit,
	 const bson_t *query,
	 const bson_t *fields );


mongoc_cursor_t *sm_aggregate (mongoc_collection_t *collection,
	 const bson_t *pipeline,
	 const bson_t *options ) BSON_GNUC_WARN_UNUSED_RESULT;

void
sm_collection_sizes( 
        PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid);

bool sm_setsockopt(
         sm_node_uri *sm_uri,
		 int level,
		 int optname,
		 void *optval,
		 int optlen); 

#endif
