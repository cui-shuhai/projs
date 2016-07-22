

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
#include "shrest_db/employee_profile.h"

employee_profile::employee_profile():SqlAccessor()
{
}

employee_profile::employee_profile(int profile_id_, string name_, string description_):
	SqlAccessor(),
	profile_id{profile_id_},
	name{name_},
	description{description_}
{
}

employee_profile::~employee_profile(){
}

void employee_profile::add_employee_profile(){

	auto sql = "INSERT INTO 'employee_profile'(profile_id, name, description) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, profile_id);
	c.bind(2, name);
	c.bind(3, description);

	c.emit();

}

void employee_profile::get_employee_profiles( map<int, string> &m)
{	
	string sql = "SELECT profile_id, name FROM employee_profile";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
