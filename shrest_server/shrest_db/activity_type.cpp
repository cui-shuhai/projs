

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
#include "shrest_db/activity_type.h"

activity_type::activity_type():SqlAccessor()
{
}

activity_type::activity_type(int type_id_, string description_):
	SqlAccessor(),
	type_id{type_id_},
	description{description_}
{
}

activity_type::~activity_type(){
}

void activity_type::add_activity_type(){

	auto sql = "INSERT INTO 'activity_type'(activity_type, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, type_id);
	c.bind(2, description);

	c.emit();

}

void activity_type::get_activity_type( map<int, string> &m)
{	
	string sql = "SELECT activity_type, description FROM activity_type";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
