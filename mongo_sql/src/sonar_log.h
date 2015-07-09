
#ifndef __SONAR_LOG_H__
#define __SONAR_LOG_H__



#define MONGO_QUERY_FAILED( x )   { \
    ereport(LOG, ( errcode(ERRCODE_FDW_UNABLE_TO_CREATE_REPLY ),errmsg(" query mongo failed: " ), errhint("%s:  %d \n", __func__, __LINE__ )));  \
    sl_log_query( " ",  x ); \
}

#define JSTRACE 
//#define JSTRACE { ereport(LOG, ( errcode(ERRCODE_FDW_UNABLE_TO_CREATE_REPLY ),errmsg(" reaches: " ), errhint("%s:  %d \n", __func__, __LINE__ ))); }


#define sonar_errmsg(  m )   ereport_domain( ERROR, TEXTDOMAIN,  m )
//extern FILE *log_file;

#define sl_tag( _x_ )         
//FILE * init_log( );
void sl_err( const char *msg,  bson_error_t *e);
void sl_log( int level, const char * msg, const char * hint );

void sl_log_query( const char* doc, bson_t * b);
void sl_log_fields( bson_t * b);

void sl_signal_handler( int sig );
void sl_set_signal_handler( sighandler_t * hdl );
void sl_reset_signal_handler( sighandler_t  hdl );
void sl_warn( bson_error_t *e, bson_t *q );

#endif
