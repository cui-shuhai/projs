

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

activity_type::activity_type(string type_name_, string description_):
	SqlAccessor(),
	type_name{type_name_},
	description{description_}
{
}

activity_type::~activity_type(){
}

void activity_type::add_activity_type(){

	auto sql = "INSERT INTO 'activity_type'(activity_name, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, type_name);
	c.bind(2, description);

	c.emit();

}

void activity_type::get_activity_type( vector< string> &m)
{	
	string sql = "SELECT activity_type, description FROM activity_type";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
