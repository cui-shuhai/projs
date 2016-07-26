
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
#include "shrest_db/employee_title.h"

employee_title::employee_title():SqlAccessor()
{
}

employee_title::employee_title(int title_name_, string description_):
	SqlAccessor(),
	title_name{title_name_},
	description{description_}
{ }

employee_title::~employee_title(){ }

void employee_title::add_employee_title(){

	auto sql = "INSERT INTO 'employee_title'(title_name, name, description) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, title_name);
	c.bind(2, description);

	c.emit();

}

void employee_title::get_employee_titles( vector<string> &m)
{	
	string sql = "SELECT title_name FROM employee_title";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
