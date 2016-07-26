

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
#include "shrest_db/employee_role.h"

employee_role::employee_role():SqlAccessor()
{
}

employee_role::employee_role(int role_name_,  string description_):
	SqlAccessor(),
	role_name{role_name_},
	description{description_}
{
}

employee_role::~employee_role(){
}

void employee_role::add_employee_role(){

	auto sql = "INSERT INTO 'employee_role'(role_name,  description) VALUES( ?, ?)";

	command c(*conn, sql);
	c.bind(1, role_name);
	c.bind(2, description);

	c.emit();

}

void employee_role::get_employee_roles( vector<string> &m)
{	
	string sql = "SELECT role_name FROM employee_role";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
