
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_log.h"
#include "shrest_db/case_table.h"

case_table::case_table():SqlAccessor()
{}

case_table::case_table(int id):SqlAccessor(),
	case_id(id)
{}

case_table::case_table( int case_id_, int assign_to_, int contact_, string subject_, int priority_, int status_, int type_, int reason_, string last_activity_, string next_activity_):
	SqlAccessor(),
	case_id{ case_id_ },
	assign_to{ assign_to_ },
	contact{ contact_ },
	subject{ subject_ },
	priority{ priority_ },
	status{ status_ },
	type{ type_ },
	reason{ reason_ },
	last_activity{ last_activity_},
	next_activity{ next_activity_}
{ }

case_table::~case_table(){}

void case_table::add_case_table(){

	string sql = "INSERT INTO 'case_tbl'( assign_to, contact, subject, priority, status, type, reason, last_activity, next_activity )"
			 "VALUES(?,?, ? ?, ?,?, ?, ?, ? )";

	command c(*conn, sql);
	c.bind(1, assign_to);
	c.bind(2, contact);
	c.bind(3, subject);
	c.bind(4, priority);
	c.bind(5, status);
	c.bind(6, type);
	c.bind(7, reason);
	c.bind(8, last_activity);
	c.bind(9, next_activity);

	c.emit();

	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	case_id  = id_res->get_int(0);
}
