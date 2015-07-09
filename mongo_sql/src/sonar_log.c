#include "sonar_utils.h"
#include "sonar_log.h"


bool sigint ;

void sl_log( int level, const char * msg, const char * hint )
{
    ereport(level, ( errcode(ERRCODE_FDW_UNABLE_TO_CREATE_REPLY ),errmsg("%s", msg ), errhint("%s", hint)));

}

void sl_log_query( const char* doc,  bson_t * b)
{
    const char *bstr = bson_as_json( b, 0 );

    ereport(LOG, ( errcode(ERRCODE_FDW_UNABLE_TO_CREATE_REPLY ),errmsg("mongo query restriction %s:\n" , doc ), errhint("%s", bstr )));

    bson_free( bstr );
}

void sl_log_fields( bson_t * b)
{
    const char *bstr = bson_as_json( b, 0 );

    ereport(LOG, ( errcode(ERRCODE_FDW_UNABLE_TO_CREATE_REPLY ),errmsg("mongo query fields:\n" ), errhint("%s", bstr )));
    bson_free( bstr );
}

void sl_signal_handler( int sig )
{
    sigint = true;
    sl_log( LOG, "USER CANCELLED REQUEST", "ctrl+c" );
}

void sl_set_signal_handler( sighandler_t * hdl )
{
    *hdl = signal( SIGINT, sl_signal_handler );
    if( *hdl == SIG_ERR )
    {
        sl_log( LOG, "Cannot install SIGINT handerl ", " " );
    }
}

void sl_reset_signal_handler( sighandler_t  hdl )
{
    signal( SIGINT, hdl );
}

void sl_err( const char *msg,  bson_error_t *e)
{
    ereport(INFO,  ( e->code,errmsg("mongoc query error: %s\n", msg ), errhint("%s", e->message )));
}

void sl_warn( bson_error_t *e, bson_t *q )
{
    const char *s = bson_as_json( q, 0 );
    ereport(INFO,  ( e->code,errmsg("mongoc query error:\n" ), errhint("%s\nquery:%s", e->message, s )));
    bson_free( s );
}
