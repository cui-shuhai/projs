

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
#include "shrest_db/case_status.h"

case_status::case_status():SqlAccessor()
{
}

case_status::case_status(string status_name_, string description_):
	SqlAccessor(),
	status_name{status_name_},
	description{description_}
{
}

case_status::~case_status(){
}

void case_status::add_case_status(){

	auto sql = "INSERT INTO 'case_status'(status_name, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, status_name);
	c.bind(2, description);

	c.emit();

}

void case_status::get_case_statuss( map<string, string> &m)
{	
	string sql = "SELECT status_name, description FROM case_status";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(0)] = res->get_string(1);
	} while(res->next_row());
}
