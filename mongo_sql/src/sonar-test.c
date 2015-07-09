/*
 * sonar-test.c
 *
 *  Created on: Aug 2, 2013
 *      Author: ury
 */

#include "sonar_utils.h"
#include <stdio.h>


int
main(int argc, const char *argv[])
{
	Sonar_Sizes sizes;
	Sonar_Connection connection;
	const char *sonar_host;
	int sonar_port;
	const char *db_name;
	const char *col_name;

	if ( argc != 5 ) {
		fprintf(stderr, "Usage: %s hostname port db-name collection-name\n",argv[0]);
		exit(1);
	}

	sonar_port = atoi(argv[2]);
	sonar_host = argv[1];
	db_name = argv[3];
	col_name = argv[4];

	if ( sonar_connect(&connection, sonar_host, sonar_port) < 0 ) {
		fprintf(stderr, "Cannot connect to %s:%d\n",sonar_host, sonar_port);
		exit(1);
	}

/*
	if ( sonar_get_sizes(&connection,db_name,col_name, &sizes) < 0 ) {
		fprintf(stderr, "Cannot get sizes.\n");
		exit(1);
	}
    */

	fprintf (stderr,"Sizes: Starts at row %lu,  %lu rows,  %lu columns. %ld overall size.\n",sizes.first_row,sizes.row_count,sizes.column_count,sizes.raw_size);
	sonar_disconnect(&connection);

}
