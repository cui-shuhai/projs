
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
#include "shrest_db/user_table.h"

user_table::user_table():SqlAccessor()
{ }

user_table::user_table(const string& loginName):
	SqlAccessor(),
	 login_name{loginName}
{ }

user_table::user_table(const string& loginName, const string &pass, int employeeId, string& rl, int p):
	SqlAccessor(),
	 login_name{loginName},
	 employee_id{employeeId},
	 role{rl},
	profile{p}
{ }

user_table::~user_table(){
}

bool user_table::check_user_exist()
{

	string check_user_exist = "SELECT COUNT(1) FROM user WHERE login_name = ? ";
	query q(*conn, check_user_exist);
	q.bind(1, login_name);
	auto res = q.emit_result();

	return res->get_row_count() == 0;
}

bool user_table::check_login_exist()
{
	string check_user_exist = "SELECT COUNT(1) FROM user WHERE login_name = ? AND pass_word = ?";
	query q(*conn, check_user_exist);
	q.bind(1, login_name);
	q.bind(2, pass_word);
	auto res = q.emit_result();

	return res->get_row_count() == 0;
}

void user_table::add_user_table(){

	string sql = "INSERT INTO 'user'(login_name, pass_word, employee_id, role, profile) VALUES(?, ?, ?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, login_name);
	c.bind(2, pass_word);
	c.bind(3, employee_id);
	c.bind(4, role);
	c.bind(5, profile);
	c.emit();
}

bool user_table::change_user_password(const string & loginName, const string &password) const
{	
	string sql = "UPDATE 'user' set pass_word = ? WHERE login_name = ?";

	command c(*conn, sql);
	c.bind(1, pass_word);
	c.bind(2, login_name);
	c.emit();
	return true;		
}


bool user_table::update_user(const string& loginName, const string &pass, int employeeId, string& rl, int p){
	
	string sql = "UPDATE 'user' SET  pass_word = ?, employee_id = ?, role = ?, profile = ? WHERE login_name = ?";

	command c(*conn, sql);
	c.bind(1, pass_word);
	c.bind(2, employee_id);
	c.bind(3, role);
	c.bind(4, profile);
	c.bind(5, login_name);
	c.emit();
	return true;
}