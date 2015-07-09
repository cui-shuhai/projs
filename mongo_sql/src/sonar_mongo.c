/*
 * sonar_mongo.c
 * These APIs are called from FDW "get mongo collection attributes 
 * 
 *  Create on: Tue Sep  2 10:11:18 PDT 2014
 *  Author: CUI, Shu Hai
 */

#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_mongo.h"
#include <mongoc-client-private.h>
#include <mongoc-host-list.h>
#include <mongoc-uri.h>


struct _mongoc_uri_t
{
    char                   *str;
    mongoc_host_list_t     *hosts;
    char                   *username;
    char                   *password;
    char                   *database;
    bson_t                  options;
    bson_t                  credentials;
    bson_t                  read_prefs;
    mongoc_write_concern_t *write_concern;
};

void
sm_collection_sizes( 
        PlannerInfo *root,
        RelOptInfo *baserel,
        Oid foreigntableid)
{
    bson_error_t err;
    SonarPlanState *fdw_private = baserel->fdw_private;

    fdw_private->sizes.row_count = mongoc_collection_count( fdw_private->uri->collection, MONGOC_QUERY_NONE, 0, 0, 0, 0, &err ); 
    if( fdw_private->sizes.row_count == -1 )
        sl_err( __func__,  &err );

    fdw_private->sizes.raw_size = sizeof ( int ) * (  baserel->reltargetlist ?  baserel->reltargetlist->length : 1 ) ; 
}


mongoc_uri_t * sm_create_uri( smp_node_uri suri )
{
    return mongoc_uri_new_for_host_port( suri->host, suri->port );
}


mongoc_uri_t * sm_create_auth_uri( smp_node_uri suri )
{
    //mongo uri string:
    //mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
    char tmp[ 1014 ] = {0};

    if( !suri )
        return suri;

    if( strcmp( suri->authmod, "MONGODB-CR" ) == 0 )
        sprintf( tmp, "mongodb://%s:%s@%s:%d/%s?authMechanism=%s", suri->usr, suri->pwd, suri->host, suri->port, suri->db_name, suri->authmod ); 
    else if( strcmp( suri->authmod, "MONGODB-X509" ) == 0 )
        sprintf( tmp, "mongodb://%s@%s:%d/%s?authMechanism=%s", suri->usr, suri->host, suri->port, suri->db_name, suri->authmod ); 
    else if( strcmp( suri->authmod, "GSSAPI" ) == 0 )
        sprintf( tmp, "mongodb://%s:%s@%s:%d/%s?authMechanism=%s", suri->usr, suri->pwd, suri->host, suri->port, suri->db_name, suri->authmod ); 
    else if( strcmp( suri->authmod, "PLAIN" ) == 0 )
        sprintf( tmp, "mongodb://%s@%s:%d/%s?authMechanism=%s", suri->usr, suri->host, suri->port, suri->db_name, suri->authmod ); 
     else
         return 0;
    return mongoc_uri_new( tmp );
}

void sm_close_node( smp_node_uri uri )
{

    if( uri->collection )
        mongoc_collection_destroy( uri->collection );

    if( uri->client )
    {
        //mongoc_client_destroy( uri->client );
        bson_free( uri->client );
    }
        
    if( uri->uri )
        mongoc_uri_destroy( uri->uri );

    mongoc_cleanup();
    free( uri );
}

mongoc_client_t *sm_connect(const mongoc_uri_t *uri, int timeo )
{
    mongoc_client_t *client = mongoc_client_new_from_uri( uri );
    client->cluster.sockettimeoutms = timeo;
    return client;
}

void sm_close( mongoc_client_t *client )
{
    mongoc_client_destroy( client );
}

void sm_query( smp_node_uri uri, 
	 uint32_t skip,
	 uint32_t limit,
	 const bson_t *query,
	 const bson_t *fields )
{
    //uri->cursor = mongoc_collection_find ( uri->collection, MONGOC_QUERY_NONE, skip, limit, 0, query, fields, 0 );
     uri->cursor = mongoc_client_command( uri->client, uri->db_name, MONGOC_QUERY_NONE, skip, limit, 0, query, fields, 0 );
}


void sm_query_db( smp_node_uri uri, 
     const char *db_name,
     const char *collection_name,
	 uint32_t skip,
	 uint32_t limit,
	 const bson_t *query,
	 const bson_t *fields )
{
     mongoc_collection_t *collection = mongoc_client_get_collection( uri->client, db_name, collection_name );

    uri->cursor = mongoc_collection_find ( collection, MONGOC_QUERY_NONE, skip, limit, 0, query, fields, 0 );
    mongoc_collection_destroy( collection );
}


mongoc_cursor_t *sm_aggregate (mongoc_collection_t *collection,
	 const bson_t *pipeline,
	 const bson_t *options ) 
{
    return mongoc_collection_aggregate (collection, MONGOC_QUERY_NONE, pipeline, options, 0 );
}

bool sm_setsockopt(
         sm_node_uri *sm_uri,
		 int level,
		 int optname,
		 void *optval,
		 int optlen)
{
    bson_error_t err;
    mongoc_stream_t *stream = 0;

    if( sm_uri->client->initiator )
        stream = sm_uri->client->initiator( sm_uri->uri, sm_uri->uri->hosts, sm_uri->client->initiator_data, &err );

    if( stream )
    {
        //mongoc_stream_setsockopt (stream, SOL_SOCKET, SO_RCVTIMEO, optval, optlen );
        mongoc_stream_setsockopt (stream, level, optname, optval, optlen );
        return true;
    }

    return false;

}
