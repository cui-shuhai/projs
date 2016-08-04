

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
#include "shrest_db/case_reason.h"

case_reason::case_reason():SqlAccessor()
{
}

case_reason::case_reason(string reason_name_, string description_):
	SqlAccessor(),
	reason_name{reason_name_},
	description{description_}
{
}

case_reason::~case_reason(){
}

void case_reason::add_case_reason(){

	auto sql = "INSERT INTO 'case_reason'(reason_name, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, reason_name);
	c.bind(2, description);

	c.emit();

}

void case_reason::get_case_reasons( map<string, string> &m)
{	
	string sql = "SELECT reason_name, description FROM case_reason";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(0)] = res->get_string(1);
	} while(res->next_row());
}
