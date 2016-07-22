

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
#include "shrest_db/employee_department.h"

employee_department::employee_department():SqlAccessor()
{
}

employee_department::employee_department(int employee_id_, string name_, string description_):
	SqlAccessor(),
	employee_id{employee_id_},
	name{name_},
	description{description_}
{
}

employee_department::~employee_department(){
}

void employee_department::add_employee_department(){

	auto sql = "INSERT INTO 'employee_department'(employee_id, name, description) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, employee_id);
	c.bind(2, name);
	c.bind(3, description);

	c.emit();

}

void employee_department::get_employee_departments( map<int, string> &m)
{	
	string sql = "SELECT department_id, name FROM employee_department";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
