

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
#include "shrest_db/case_priority.h"

case_priority::case_priority():SqlAccessor()
{
}

case_priority::case_priority(int priority_, string description_):
	SqlAccessor(),
	priority{priority_},
	description{description_}
{
}

case_priority::~case_priority(){
}

void case_priority::add_case_priority(){

	auto sql = "INSERT INTO 'case_priority'(priority, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, priority);
	c.bind(2, description);

	c.emit();

}

void case_priority::get_case_prioritys( map<int, string> &m)
{	
	string sql = "SELECT priority, description FROM case_priority";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
