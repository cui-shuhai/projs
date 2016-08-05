
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <map>
#include <iostream>
#include <sstream>

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_db/user_table.h"
#include "shrest_db/employee_table.h"
#include "shrest_log.h"

user_table::user_table():SqlAccessor()
{ }

user_table::user_table(const string& loginName):
	SqlAccessor(),
	 login_name{loginName}
{ }

user_table::user_table(const string& loginName, const string &pass,
	 string employeeId, string rl, string p,
	 string w, string c_id):
	SqlAccessor(),
	 login_name{loginName},
	 pass_word{pass},
	 employee_id{employeeId},
	 role_name{rl},
  	 profile_name{p},
  	 create_date{w},
  	 creator_id{c_id}
{ }

user_table::~user_table(){
}

bool user_table::check_user_exist()
{

	string check_user_exist = "SELECT COUNT(1) FROM crm_user WHERE login_name = ? ";
	query q(*conn, check_user_exist);
	q.bind(1, login_name);
	auto res = q.emit_result();

	return res->get_int(0) == 1;
}

bool user_table::check_login_exist()
{
	string check_user_exist = "SELECT COUNT(1) FROM crm_user WHERE login_name = ? AND pass_word = ?";
	query q(*conn, check_user_exist);
	q.bind(1, login_name);
	q.bind(2, pass_word);
	auto res = q.emit_result();

	return res->get_int(0) == 1;
}

void user_table::add_user_table(){

	string sql = "INSERT INTO 'crm_user'(login_name, pass_word, employee_id, role_name, profile_name, create_date, creator_id) VALUES(?, ?, ?, ?, ?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, login_name);
	c.bind(2, pass_word);
	c.bind(3, employee_id);
	c.bind(4, role_name);
	c.bind(5, profile_name);
	c.bind(6, create_date);
	c.bind(7, creator_id);
	c.emit();
}

bool user_table::change_user_password(const string & loginName, const string &password) const
{	
	string sql = "UPDATE 'crm_user' set pass_word = ? WHERE login_name = ?";

	command c(*conn, sql);
	c.bind(1, pass_word);
	c.bind(2, login_name);
	c.emit();
	return true;		
}


bool user_table::update_user(const string& loginName, const string &pass, string employeeId, string rl, string p){
	
	string sql = "UPDATE 'crm_user' SET  pass_word = ?, employee_id = ?, role_name = ?, profile_name = ? WHERE login_name = ?";

	command c(*conn, sql);
	c.bind(1, pass_word);
	c.bind(2, employee_id);
	c.bind(3, role_name);
	c.bind(4, profile_name);
	c.bind(5, login_name);
	c.emit();
	return true;
}

void user_table::get_user_list( map<string, string> &m){
	string sql = "SELECT first_name, last_name,  employee.employee_id from employee INNER JOIN crm_user ON crm_user.employee_id = employee.employee_id";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(2)] = res->get_string(0) + res->get_string(1);
	} while(res->next_row());
}

void user_table::get_user_records( string source, string &result ){

		string sql = "SELECT login_name, pass_word, employee_id, role_name, profile_name, create_date, creator_id FROM crm_user ";

		if(!source.empty())
		sql.append("WHERE employee.employee_source = ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"recordset\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss << "\"login_name\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"pass_word\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"employee_id\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"role_name\"" << ":" << "\"" << res->get_string(3) << "\"" << ",";
			ss << "\"profile_name\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"create_date\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"creator_id\"" << ":" << "\"" << res->get_string(6) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

void user_table::update_user_table(){

	stringstream ss;
	 ss <<  "UPDATE crm_user SET ";
	//ss << "login_name =" << "\"" << login_name << "\"" << ",";
	//ss << "pass_word =" << "\"" << pass_word << "\"" << ",";
	ss << "employee_id =" << "\"" << employee_id << "\"" << ",";
	ss << "role_name =" << "\"" << role_name << "\"" << ",";
	ss << "profile_name =" << "\"" << profile_name << "\"" << ",";
	ss << "create_date =" << "\"" << create_date << "\"" << ",";
	ss << "creator_id =" << "\"" << creator_id << "\"" ;
	ss << " WHERE login_name = " <<  "\"" << 	login_name <<  "\"" ;


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();

}
