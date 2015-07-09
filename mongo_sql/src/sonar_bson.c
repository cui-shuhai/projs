
#include "sonar_utils.h"
#include "sonar_bson.h"


/** convert SQL IN expression and append to bson_t object
*  for IN expression, there should be a list of elements of the same kind elements
* we should iterate the like and call bson_append_XXX( &sb, "0, 1, 2, 3 etc", typeval );
*/

bool sb_append_in( bson_t *b, const Expr * const expr )
{

	bool rc = false;
	int idx; 
    bson_t sb;

	array_unit au = {0};

	ScalarArrayOpExpr * arrexpr = (ScalarArrayOpExpr*) expr;

	Const * const c = (Const *) get_arg_by_type(arrexpr->args, T_Const);

	const char *  op_name;
	snop_id opid;
	
	ArrayType *at;
	
	if( !c )
	return rc;

	at  =  DatumGetArrayTypeP( c->constvalue );

	op_name = get_opname( arrexpr->opno );
	opid = su_sop_from_pg( op_name );

	if( opid == SONA_EQ && arrexpr->useOr == 1 )
        BSON_APPEND_ARRAY_BEGIN( b, "$in", &sb );
	else if( opid == SONA_NE )
        BSON_APPEND_ARRAY_BEGIN( b, "$nin", &sb );
	else
    {
		//XXX some other op
	}

	switch ( at->elemtype )
	{
		case INT4OID:
		//case INT4ARRAYOID:
		{
			int32 *p = (int *)ARR_DATA_PTR(at);
			for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
			{
				rc = BSON_APPEND_INT32( &sb, array_index( &au ), DatumGetInt32( *(p + idx ) ));
				ASSERT_BSON_OK(rc);
			}
			break;
		}
		case INT8OID:
		case OIDOID:
		{
			int64 *p = (int64 *)ARR_DATA_PTR(at);
			for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
			{
                //XXX somehow preprocessor doesn't work correctly here
				//rc = BSON_APPEND_INT64( &sb, array_index( &au ), DatumGetInt64( p + idx  ));
				rc = BSON_APPEND_INT64( &sb, array_index( &au ), *(int64*)(char*)( p + idx  ));
				ASSERT_BSON_OK(rc);
			}
			break;
		}

		case FLOAT8OID:
		{
			int64 *p = (int64 *)ARR_DATA_PTR(at);
			for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
			{
				rc = BSON_APPEND_DOUBLE( &sb, array_index( &au ), DatumGetFloat8( *(p + idx ) ));
				ASSERT_BSON_OK(rc);
			}
			break;
		}
		case BITOID:
		case VARBITOID:
		{
			int64 *p = (int64 *)ARR_DATA_PTR(at);

			for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
			{
				//XXX some wrong here for DatumGetObjectId, type mismatch...	
				//rc = bson_append_oid( &sb, array_index( &au ), (bson_oid_t*)DatumGetObjectId( *(p + idx ) ));
				rc = BSON_APPEND_INT32( &sb, array_index( &au ), DatumGetObjectId( *(p + idx ) ));
				ASSERT_BSON_OK(rc);
			}
			break;
		}
		case TEXTOID:
		{
            int dm ;
            char** t = 0;
            
            sp_get_text_array_contents( at, &dm, &t );

            for( idx = 0; idx < dm; idx++ )
            {
                rc = BSON_APPEND_UTF8( &sb, array_index( &au ), t[idx] ); 
                ASSERT_BSON_OK(rc);
            }

            free( t );
			break;
		}
	}


	rc = bson_append_array_end( b, &sb );
	ASSERT_BSON_OK(rc);

	return rc;
}
/*** NB. postgres or maybe yacc etc automatically converti between and to ">=" and "<=" */
/* sb_append_bn converts SQL between a and b to BSON  "$and": { { "gte", a }, { "lte", b } }
* format. expr should containe two Const node and of the same type
*/

bool sb_append_bn( bson_t *b, const Expr * const expr )
{
	Const *c;
	int rc = false;
    bson_t sb;
	
	// get const expr
	c = (Const *) get_arg_by_type(((OpExpr*)expr)->args, T_Const);
	if( !c )
		return rc;

	rc = BSON_APPEND_ARRAY_BEGIN( b, "$and", &sb );
	ASSERT_BSON_OK(rc);
	// get const expr type, then we know how to make bson_t object

	// SQL between is inclusive, there is no between in sonar => >= and <=
	switch (c->consttype)
	{
		case INT2OID:
		case INT4OID:
			// append int
			rc = BSON_APPEND_INT32( &sb, "$ge", c->constbyval ? c->constvalue : *(int*)c->constvalue );
			ASSERT_BSON_OK(rc);
			rc = BSON_APPEND_INT32( &sb, "$le", c->constbyval ? c->constvalue : *(int*)c->constvalue );
			ASSERT_BSON_OK(rc);
			break;
		case INT8OID:
		case OIDOID:
			// append long
			rc = BSON_APPEND_INT64( &sb, "$ge", c->constbyval ? c->constvalue : *(long*)c->constvalue );
			ASSERT_BSON_OK(rc);
			rc = BSON_APPEND_INT64( &sb, "$le", c->constbyval ? c->constvalue : *(long*)c->constvalue );
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_INT64( &sb, "$le", c->constbyval ? c->constvalue : *(long*)c->constvalue );
			ASSERT_BSON_OK(rc);
		case BITOID:
		case VARBITOID:
			rc = bson_append_binary( &sb, "$ge", -1, c->consttype, c->constbyval ? (const uint8_t*)c->constvalue : (const uint8_t*)c->constvalue, c->constlen  );
			ASSERT_BSON_OK(rc);
			rc = bson_append_binary( &sb, "$le", -1, c->consttype, c->constbyval ? (const uint8_t*)c->constvalue : (const uint8_t*)c->constvalue, c->constlen  );
			ASSERT_BSON_OK(rc);
			break;
		break;

		case BOOLOID:
			rc = bson_append_bool( &sb, "$exist", -1, c->constbyval ? c->constvalue : c->constvalue) ;
			ASSERT_BSON_OK(rc);
			break;


	}

	rc = bson_append_array_end( b, &sb );
	ASSERT_BSON_OK(rc);

	return rc;
}


/* sb_append_rx converts SQL LIKE etc to bson_t $regex expression
* bson_t $regex use perl regex, SQL use simple format only % ? etc.
* so wee need to convert it
*/
bool sb_append_rx( bson_t *b, const Expr * const expr , bool insens )
{
	Const *c;
	int rc = false;
	Oid funcid = InvalidOid;
	bool varlen = false;

	char *pc; 
	char brgx[ 256 ] = {0};
	int bi = 0;

    getTypeOutputInfo( TEXTOID, &funcid, &varlen );

	// get const expr -- TEXTOID 
	c = (Const *) get_arg_by_type(((OpExpr*)expr)->args, T_Const);

	pc = OidOutputFunctionCall(funcid, c->constvalue);
	
    //if( *pc != '_' && *pc != '%' )
    if( *pc != '%' )
        brgx[ bi++ ] = 0x5e;

	while( *pc )
	{
		if( *pc == '%' )
		{
			brgx[ bi++ ] = '.';
			brgx[ bi++ ] = '*';
		}
		else if( *pc == '_' )
		{
			brgx[ bi++ ] = '.';
		}
		else
		{
			brgx[ bi++ ] = *pc;
		}
		pc++;
	}


	rc = BSON_APPEND_UTF8( b, "$regex", brgx );
	ASSERT_BSON_OK(rc);
	
	// case insensitive
    if( insens )
    {
        rc = BSON_APPEND_UTF8( b, "$options", "i" );
        ASSERT_BSON_OK(rc);
    }

	return rc;
}


/* sb_append_nx converts SQL LIKE etc to bson_t $regex expression
* this implements regex not match
* so wee need to convert it
*/
bool sb_append_nx( bson_t *b, const Expr * const expr, const char* col_name , bool insens  )
{
    bson_t nora;
    bson_t norb;
    bson_t norc;

    BSON_APPEND_ARRAY_BEGIN( b, "$nor", &norb);
    BSON_APPEND_DOCUMENT_BEGIN( &norb, "0", &norc);
    BSON_APPEND_DOCUMENT_BEGIN( &norc, col_name, &nora);
    sb_append_rx( &nora, expr, insens );
    bson_append_document_end( &norc, &nora );
    bson_append_document_end( &norb, &norc );
    bson_append_array_end( b, &norb );
}

bool sb_append_sa( bson_t *b, const Expr * const expr )
{
	return false;
}

bool sb_append_md( bson_t *b, const  Const  *d, const Const * r )
{
	int rc = false;
    bson_t sb;

    rc = BSON_APPEND_ARRAY_BEGIN( b, "$mod", &sb );
    ASSERT_BSON_OK(rc);

    rc = sb_append_eq( &sb, "0", d );
    ASSERT_BSON_OK(rc);

    rc = sb_append_eq( &sb, "1", r );
    ASSERT_BSON_OK(rc);

    rc = bson_append_array_end( b, &sb );
    ASSERT_BSON_OK(rc);

	return rc;
}

bool sb_append_mt( bson_t *b, const Expr * const expr )
{
	//Const *c;
	int rc = false;

	return rc;
}

bool sb_append_nm( bson_t *b, const Expr * const expr )
{
	//Const *c;
	int rc = false;

	return rc;
}

bool sb_append_eq( bson_t * b, const char * name, const Const * const c )
{
    return sb_append_eq2( b, name, c->consttype, c->constvalue );
}

bool sb_append_eq2( bson_t * b, const char* name,  Oid consttype, Datum constvalue)
{

	int rc = false;

	switch ( consttype )
	{
		case INT2OID:
			rc = BSON_APPEND_INT32( b, name,  DatumGetInt16(constvalue ));
			ASSERT_BSON_OK(rc);
			break;
		case INT4OID:
			rc = BSON_APPEND_INT32( b, name,  DatumGetInt32(constvalue ));
			// append int
			break;
		case INT8OID:
			rc = BSON_APPEND_INT64( b, name,  DatumGetInt64(constvalue ));
		case OIDOID:
			//rc = bson_append_oid( b, name, (bson_oid_t *)  DatumGetObjectId(constvalue ));
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_DOUBLE( b, name, DatumGetFloat8( constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT4OID:
			rc = BSON_APPEND_DOUBLE( b, name, DatumGetFloat4( constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case TEXTOID:
		{
			//rc = BSON_APPEND_UTF8( b, name, DatumGetCString( constvalue ));
			rc = BSON_APPEND_UTF8( b, name, text_to_cstring( DatumGetTextP( constvalue )));
			ASSERT_BSON_OK(rc);
			break;
		}
		case BOOLOID:
			rc = bson_append_bool( b, name, -1, DatumGetBool( constvalue ) );
			ASSERT_BSON_OK(rc);
		break;
	}
	return rc;
}

bool sb_insert_eq( bson_t * b, const char * name, const Const * const c )
{
    return sb_insert_eq2( b, name, c->consttype, c->constvalue );
}

bool sb_insert_eq2( bson_t * b, const char* name,  Oid consttype, Datum constvalue)
{

	int rc = false;

	switch ( consttype )
	{
		case INT2OID:
			rc = BSON_APPEND_INT32( b, name,  DatumGetInt16(constvalue ));
			ASSERT_BSON_OK(rc);
			break;
		case INT4OID:
			rc = BSON_APPEND_INT32( b, name,  DatumGetInt32(constvalue ));
			// append int
			break;
		case INT8OID:
			rc = BSON_APPEND_INT64( b, name,  DatumGetInt64(constvalue ));
		case OIDOID:
			//rc = bson_append_oid( b, name, (bson_oid_t *)  DatumGetObjectId(constvalue ));
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_DOUBLE( b, name, DatumGetFloat8( constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT4OID:
			rc = BSON_APPEND_DOUBLE( b, name, DatumGetFloat4( constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case TEXTOID:
		{
			//rc = BSON_APPEND_UTF8( b, name, DatumGetCString( constvalue ));
			rc = BSON_APPEND_UTF8( b, name, text_to_cstring( DatumGetTextP( constvalue )));
			ASSERT_BSON_OK(rc);
			break;
		}
		case BOOLOID:
			rc = bson_append_bool( b, name, -1, DatumGetBool( constvalue ) );
			ASSERT_BSON_OK(rc);
		break;
	}
	return rc;
}

/** sb_append_xx 
* b - bson_t object
* opid - sonar operator id
* c - value pointer
* return NONE
*/

bool
sb_append_xx( bson_t * b,
		 snop_id opid,
		 const Const * const c )
{
	int rc = false;

	switch ( c->consttype )
	{
		case INT2OID:
			rc = BSON_APPEND_INT32( b, OpMap[ opid ].sn_op,  DatumGetInt16(c->constvalue ));
			ASSERT_BSON_OK(rc);
			break;
		case INT4OID:
			rc = BSON_APPEND_INT32( b, OpMap[ opid ].sn_op,  DatumGetInt32(c->constvalue ));
			ASSERT_BSON_OK(rc);
			break;
			// append int
			break;
		case INT8OID:
			rc = BSON_APPEND_INT64( b, OpMap[ opid ].sn_op,  DatumGetInt64(c->constvalue ));
			ASSERT_BSON_OK(rc);
			break;
		case OIDOID:
			//rc = bson_append_oid( b, OpMap[ opid ].sn_op, (bson_oid_t *)  DatumGetObjectId(c->constvalue ));
			ASSERT_BSON_OK(rc);
			break;

		case FLOAT8OID:
			rc = BSON_APPEND_DOUBLE( b, OpMap[ opid ].sn_op, DatumGetFloat8( c->constvalue ) );
			ASSERT_BSON_OK(rc);
			break;

		case TEXTOID:
		{
			//rc = BSON_APPEND_UTF8( b, OpMap[ opid ].sn_op, DatumGetCString( c->constvalue ));
			rc = BSON_APPEND_UTF8( b, OpMap[ opid ].sn_op, text_to_cstring( DatumGetTextP( c->constvalue )));
			ASSERT_BSON_OK(rc);
			break;
		}
		case BOOLOID:
        {
			rc = bson_append_bool( b, OpMap[ opid ].sn_op, -1, DatumGetBool( c->constvalue ) );
			ASSERT_BSON_OK(rc);
            break;
        }
		case TIMESTAMPOID:
        {
            Timestamp tstamp = DatumGetTimestamp( c->constvalue );
            int64_t mseconds = tstamp + PGUNIX_TSDIFF ;
            
            rc = BSON_APPEND_DATE_TIME( b, OpMap[ opid ].sn_op, mseconds / 1000 );
			ASSERT_BSON_OK(rc);
            break;
        }
		case FLOAT4OID:
        {
			rc = BSON_APPEND_DOUBLE( b, OpMap[ opid ].sn_op, DatumGetFloat4( c->constvalue ) );
			ASSERT_BSON_OK(rc);
            break;
        }
		case TEXTARRAYOID:
        {
			rc = BSON_APPEND_DOUBLE( b, OpMap[ opid ].sn_op, DatumGetFloat4( c->constvalue ) );
			ASSERT_BSON_OK(rc);
            break;
        }
        case NUMERICOID:
        {
            Numeric num = DatumGetNumeric( c->constvalue );
			//rc = BSON_APPEND_DOUBLE( b, OpMap[ opid ].sn_op, DatumGetFloat4( c->constvalue ) );
			ASSERT_BSON_OK(rc);
            break;
        }
        default:
        {
            break;
        }
	}
	return rc;
}


bool 
sb_append_arr_all( bson_t * b,
		 const Const * const c )
{

	int rc = false;
	int idx; 
    bson_t sb;
	array_unit au = {0};

	ArrayType *at  =  DatumGetArrayTypeP( c->constvalue );


	BSON_APPEND_ARRAY_BEGIN( b, "$all", &sb );


	switch ( at->elemtype )
	{
		case TEXTOID:
			{
				int dm ;
				char** t;

                sp_get_text_array_contents( at, &dm , &t);

				for( idx = 0; idx < dm; idx++ )
				{
					rc = BSON_APPEND_UTF8( &sb, array_index( &au ), t[idx] ); 
					ASSERT_BSON_OK(rc);
				}

				free( t );
			}
			break;
		case INT4OID:
			{
				int32 *p = (int *)ARR_DATA_PTR(at);
				for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
				{
					rc = BSON_APPEND_INT32( &sb, array_index( &au ), DatumGetInt32( *(p + idx ) ));
					ASSERT_BSON_OK(rc);
				}
				break;
			}
			break;
		case FLOAT8OID:
			{
				int64 *p = (int64 *)ARR_DATA_PTR(at);
				for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
				{
					rc = BSON_APPEND_DOUBLE( &sb, array_index( &au ), DatumGetFloat8( *(p + idx ) ));
					ASSERT_BSON_OK(rc);
				}
				break;
			}
		case OIDOID:
		case INT8OID:
			{
				int64 *p = (int64 *)ARR_DATA_PTR(at);
				for( idx = 0; idx <  ARR_DIMS( at )[0]; idx++ )
				{
					rc = BSON_APPEND_INT64( &sb, array_index( &au ), DatumGetInt64( p + idx  ));
					ASSERT_BSON_OK(rc);
				}
				break;
			}
			ASSERT_BSON_OK(rc);
			break;

		default:
			break;
	}
	bson_append_array_end( b, &sb );
	return rc;
}

bool 
sb_append_arr_eq( bson_t * b,
		 const char * name,
		 const Const * const c )
{

	int rc = false;
    bson_t sbd;

	bson_append_document_begin( b, name, -1, &sbd );

    sb_append_arr_all( &sbd, c );

	bson_append_document_end( b, &sbd );
	return rc;
}

int sb_array_as_json( const bson_t * b, char ** buf, Oid t )
{
    int rc;
    sb_sprintf( buf, "[%d]={", bson_count_keys( b ) );

	rc = sb_sprint( buf , b , t );

    sb_sprintf( buf, "}" );

	return rc;
}

int sb_array_as_json2( const bson_t * b, char ** buf, Oid t )
{
    int rc = true;
    sb_sprintf( buf, "[");

	sb_sprint( buf , b , t );

    sb_sprintf( buf, "]" );

	return rc;
}

int sb_array_json( const bson_t * b, char ** buf, Oid t, const char *fld )
{
    int rc;
    sb_sprintf( buf, "{\"%s\":[", fld );

	rc = sb_sprint( buf , b , t );

    sb_sprintf( buf, "]}" );

	return rc;
}

int sb_sprintf(  char **buf, const char *format, ... )
{
    va_list ap;
    int ret = 0;
    va_start( ap, format );
    ret = vsprintf( *buf, format, ap );
    va_end( ap );

    *buf += ret;

    return ret;
	
}

int sb_sprint( char ** buf, const bson_t *b,  Oid t )
{

	return sb_sprint_raw(  buf, b, t );
}

int sb_sprint_raw( char* *buf, const  bson_t *b, Oid  e )
{
    int rc = 0;
	bool first = true;
    bool added;
    const bson_value_t * v;
    bson_type_t t;
    char **sb = buf;

    bson_iter_t it;

    bson_iter_init( &it, b ); 

    while( bson_iter_next( &it ) )
    {
        SU_BSON_VAL( &it );
        SU_VAL_TYPE( v );
	
		if( first )
		{
		 	first = false;	
		}
		else
		{
            if( added )
                sb_sprintf( sb, "%s "  , "," );
		}

        added = false;


        switch ( t ) 
        {
            case BSON_TYPE_DOUBLE:
                if( e == FLOAT4ARRAYOID || e == JSONOID || e == FLOAT8ARRAYOID  )
                {
                    sb_sprintf( sb, "%f" , SU_TYPE_VAL( double) );
                    rc = 1;
                    added = true;
                }
                break;
            case BSON_TYPE_UTF8:
            if( e == TEXTARRAYOID  || e == JSONOID )
            {
                sb_sprintf( sb, "\"%s\"" , SU_TYPE_STR( utf8 ));
                rc = 1;
                added = true;
            }
                break;
            case BSON_TYPE_SYMBOL:
                sb_sprintf( sb, "\"%s\"" , SU_TYPE_STR( utf8 ));
                rc = 1;
                added = true;
                break;
            case BSON_TYPE_OID:
            {
                char id[ 25 ];

                bson_oid_to_string( &SU_TYPE_VAL( oid ), id );
                sb_sprintf( sb, "%s" , id );
                rc = 1;
                added = true;
            }
                break;
            case BSON_TYPE_BOOL:
                sb_sprintf( sb, "%s" , SU_TYPE_VAL( bool ) ? "true" : "false" );
                rc = 1;
                added = true;
                break;
            case BSON_TYPE_DATE_TIME:
            {
                sb_sprintf( sb, "%ld" , SU_TYPE_VAL( datetime ) );
                rc = 1;
                added = true;
            }
                break;
            case BSON_TYPE_NULL:
                sb_sprintf( sb, "%s", "null" );
                rc = 1;
                added = true;
                break;
            case BSON_TYPE_REGEX:
            {
                const char *regex = NULL;
                const char *options = NULL;
                regex = bson_iter_regex ( &it, &options);

                sb_sprintf( sb, "{ \"$regex\" : \"%s\", \"$option\" : \"%s\" } ", regex, options );
                rc = 1;
                added = true;
            }
                break;
            case BSON_TYPE_CODE:
                sb_sprintf( sb, "%s", SU_TYPE_STR( utf8 ) );
                rc = 1;
                added = true;
                break;
            case BSON_TYPE_INT32:
            if( e == INT4ARRAYOID || e == JSONOID )
            {
                sb_sprintf( sb, "%d" , SU_TYPE_VAL( int32 ));
                rc = 1;
                added = true;
            }
                break;
            case BSON_TYPE_INT64:
            if( e == INT4ARRAYOID || e == JSONOID )
            {
                sb_sprintf( sb, "%lld" , SU_TYPE_VAL( int64 ));
                rc = 1;
                added = true;
            }
                break;
            case BSON_TYPE_DOCUMENT:
            {
                bson_t b; 
                const char *json;

                bson_init_static( &b, v->value.v_doc.data,  v->value.v_doc.data_len );
                json = bson_as_json( &b, 0 );
               
                sb_sprintf( sb, "%s" , json ); 
                rc = 1;
                added = true;
                bson_free(json);

                break;
            }
            case BSON_TYPE_TIMESTAMP:
            {
                uint32_t  timestamp; 
                uint32_t  increment;
                bson_iter_timestamp ( &it, &timestamp, &increment);

                sb_sprintf( sb, "{ \"i\": %d, \"t\": %d }", timestamp, increment );
                rc = 1;
                added = true;
            }
            break;
            case BSON_TYPE_UNDEFINED:
            {
                uint32_t len;
                const uint8_t *doc;
                bson_t b;

                bson_iter_document( &it, &len, &doc );

                bson_init_static( &b, doc, len );

                sb_sprintf( sb, "%d" , 0  ); 
                rc = 1;
                added = true;
            }
            default:
                sb_sprintf( sb, "%s", "" );
        }
    }
    return rc;
}

bool sb_all_one( const bson_t *b )
{
    bson_iter_t it;

    bson_iter_init( &it, b );
    while( bson_iter_next( &it ) )
    {
        int i = bson_iter_int32( &it );
        if( i != 1 )
        {
            return false;
        }
    }

    return true;
}

void sb_append_wild( bson_t *b, snop_id opid, const Expr *expr, const Const *c )
{
    int rc = 0;
    
    switch( opid )
    {
        case  SONA_LE:
        case  SONA_LT:
        case  SONA_GT:
        case  SONA_GE:
        case  SONA_EQ:
        case  SONA_NE:
        {
            ListCell *celln;
            char fn[ NAMEDATALEN ] = {0};

            sb_append_xx( b, opid, c );
        }
            break;

        case  SONA_BN:
            rc = sb_append_bn( b, expr);
            ASSERT_BSON_OK(rc);
            break;

         // SQL LIKE --> bson_t $regex
        case  SONA_RX:
            rc = sb_append_rx( b, expr, false );
            ASSERT_BSON_OK(rc);
            break;
         // SQL ILIKE --> bson_t $regex
        case  SONA_IRX:
            rc = sb_append_rx( b, expr, true );
            ASSERT_BSON_OK(rc);
            break;

        case SONA_SA:
            rc = sb_append_sa( b, expr );
            ASSERT_BSON_OK(rc);
            break;

#if 0
        case SONA_MDO:
            rc = sb_append_md( b, expr );
            ASSERT_BSON_OK(rc);
            break;
#endif

        case SONA_MT:
            rc = sb_append_mt( b, expr );
            ASSERT_BSON_OK(rc);
            break;

        case SONA_NM:
            rc = sb_append_nm( b, expr );
            ASSERT_BSON_OK(rc);

        default:
            break;
    
    }
}
