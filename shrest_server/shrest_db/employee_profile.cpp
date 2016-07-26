

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

employee_profile::employee_profile(string profile_name_,  string description_):
	SqlAccessor(),
	profile_name{profile_name_},
	description{description_}
{
}

employee_profile::~employee_profile(){
}

void employee_profile::add_employee_profile(){

	auto sql = "INSERT INTO 'employee_profile'(profile_name, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, profile_name);
	c.bind(2, description);

	c.emit();

}

void employee_profile::get_employee_profiles( vector<string> &m)
{	
	string sql = "SELECT profile_name FROM employee_profile";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
