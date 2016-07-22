
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

employee_title::employee_title(int title_id_, string name_, string description_):
	SqlAccessor(),
	title_id{title_id_},
	name{name_},
	description{description_}
{ }

employee_title::~employee_title(){ }

void employee_title::add_employee_title(){

	auto sql = "INSERT INTO 'employee_title'(title_id, name, description) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, title_id);
	c.bind(2, name);
	c.bind(3, description);

	c.emit();

}

void employee_title::get_employee_titles( map<int, string> &m)
{	
	string sql = "SELECT title_id, name FROM employee_title";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
