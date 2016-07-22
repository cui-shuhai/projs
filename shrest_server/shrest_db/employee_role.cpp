

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

employee_role::employee_role(int role_id_, string name_, string description_):
	SqlAccessor(),
	role_id{role_id_},
	name{name_},
	description{description_}
{
}

employee_role::~employee_role(){
}

void employee_role::add_employee_role(){

	auto sql = "INSERT INTO 'employee_role'(role_id, name, description) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, role_id);
	c.bind(2, name);
	c.bind(3, description);

	c.emit();

}

void employee_role::get_employee_roles( map<int, string> &m)
{	
	string sql = "SELECT role_id, name FROM employee_role";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
