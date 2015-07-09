
#include "sonar_utils.h"
#include "sonar_log.h"

#include "catalog/pg_foreign_server.h"
#include "catalog/pg_foreign_table.h"
#include "catalog/pg_user_mapping.h"

#define MONGO_OBJ_LEN  ( 12 )
#define TO_HEX(i)	 (( i ) <= 9 ? '0' + ( i ) : 'a' - 10 + ( i ))

char * sonar_prepend( char * d, const char * s, const char * prefix )
{
	sprintf( d, "%s%s", prefix, s );
	return d; 
}


const char * array_index( array_unit * au )
{

	sprintf( au->buf, "%d",  au->idx++ );
	return au->buf;	
}

//so is 37 bytes long char[], si is 12 byte long char[]
// convert si to ObjectId("x*12")
void m2oidstr( const char *  const si , char *so )
{

	char *p = so + 10;
	char *pi = (char*)si;
	int i;
	int idx = 0;

	for( idx = 0; idx < MONGO_OBJ_LEN; idx++ )
	{
		pi = (char*) si + idx ;
		i = ( *pi & 0xF0 ) >> 4;
		*p++ = TO_HEX( i );
		i = ( *pi++ ) & 0x0F;
		*p++ = TO_HEX( i );
	}
}

bool sonar_var_in_list( List * l, Var* v )
{
	ListCell *c;

	foreach( c , l )
	{
		Var * n = lfirst( c );
		
		if( n->varattno  == v->varattno  )
			return true;
	}

	return false;
}



void su_move_copy( void ** s, void **d )
{
    *d = *s;
    *s = 0;
}


void su_namecpy( char *d, const char * s )
{
     int l = strlen( s );

     l > NAMEDATALEN ?  memcpy(d, s, NAMEDATALEN ): memcpy(d, s, l);
}


bool su_cook_for_print( char * str, char** cs)
{
    int l0 = strlen( str );
    int l = l0; 
    char* p = str;
    char* pc;

    while( *p != 0 )
    {
        if( *p == 0xa || *p == 0x9 ||  *p == '\\'  )
            l++;
        p++;
    }


    *cs = malloc( l + 1 );
    pc = *cs;

    if( l == l0 )
    {
        memset( pc, 0, l+1 );
        memcpy( pc, str, l );
    }
    else
    {
        while( *p !=0 )
        {
            if( *p == 0xa || *p == 0x9 ||  *p == '\\'  )
                *pc++ = '\\';
            *pc++ = *p++;
        }
    }

    return true;

}

void su_update_name( char *s )
{
    char *p = s;
    while( *p )
    {
        if( *p =='.' )
            *p = '_';
        p++;
    }

}

const  enum snop_id
su_sop_from_pg(const char *opname)
{
	int i = 0;
	for ( i = 0 ; OpMap[i].pg_op != NULL ; i++ )
		if ( strncmp(OpMap[i].pg_op, opname, MAXOPNAMELEN) == 0 )
			return i;
	return SONA_LAST;
}

const char * 
snopname_from_pg(const char *opname)
{
    return OpMap[ su_sop_from_pg( opname ) ].sn_op;
}

void * list_nth_node( List *l, int  n )
{
    int len = l->length;
    if( n > len )
    {
        return lfirst( l->tail );
    }
    else
    {
        int pos = 0;
        ListCell *c;
        foreach( c, l )
        {
            if( pos == n )
                return lfirst( c );
            pos++;
        }
    }
    return 0;
}


void su_bson_list_free( List *list )
{
    bson_t *b;
    ListCell *cell = list_head(list);
    while (cell != NULL)
    {
        ListCell *tmp = cell;
        cell = lnext(cell);

        b  = lfirst( tmp );
        bson_destroy( b );
        free(tmp);
    }
}

// test if n1 space includes n2
bool su_name_cover( const char *n1, const char * n2 )
{
    char  cmp_name[NAMEDATALEN] = {0};

    if( strlen( n1 ) > strlen( n2 ) )
        return false;

    sprintf( cmp_name, "%s.", n1 );

    if( strncmp( cmp_name, n2, strlen( cmp_name ) ) == 0 )
        return true;

    return false;
}

