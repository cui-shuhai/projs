

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
#include "shrest_db/case_type.h"

case_type::case_type():SqlAccessor()
{
}

case_type::case_type(string type_name_, string description_):
	SqlAccessor(),
	type_name{type_name_},
	description{description_}
{
}

case_type::~case_type(){
}

void case_type::add_case_type(){

	auto sql = "INSERT INTO 'case_type'(type_name, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, type_name);
	c.bind(2, description);

	c.emit();

}

void case_type::get_case_types( map<string, string> &m)
{	
	string sql = "SELECT type_name, description FROM case_type";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(0)] = res->get_string(1);
	} while(res->next_row());
}
