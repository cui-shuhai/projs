
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
#include "shrest_db/cookie_table.h"

cookie_table::cookie_table():SqlAccessor()
{}

cookie_table::cookie_table(const string& sessionId):
	SqlAccessor(),
	 session_id{sessionId}
{}

cookie_table::cookie_table(const string& sessionId, const string& username, const string& password):
	SqlAccessor(),
	 session_id{sessionId},
	 user_name{username},
	 pass_word{password}
{}

cookie_table::~cookie_table(){}

void cookie_table::delete_cookie_table()
{
	string sql = "DELETE FROM cookie WHERE session_id = '";
	sql.append(session_id).append("'");

	command c(*conn, sql);
	c.emit();
}
void cookie_table::add_cookie_table(){

	string sql = "INSERT INTO 'cookie'(session_id, user_name, password) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, session_id);
	c.bind(2, user_name);
	c.bind(3, pass_word);
	c.emit();
}

bool cookie_table::get_cookie_user()
{
		
	string sql = "SELECT user_name, password FROM cookie where session_id = '";
	//string sql = "SELECT user_name, password FROM cookie where session_id = '";
	sql.append(session_id).append("'");

	query cookie_query(*conn, sql);
	//cookie_query.bind(1, session_id);

	auto res = cookie_query.emit_result();
	user_name = res->get_string(0);
	pass_word = res->get_string(1);		
}
	
string cookie_table::get_user_id(){	
	string sql = "SELECT employee_id  FROM user  INNER JOIN cookie ON cookie.user_name = user.login_name AND cookie.password = user.pass_word WHERE cookie.session_id = ?";
	//sql.append(session_id);

	query id_query(*conn, sql);
	id_query.bind(1, session_id);

	auto res = id_query.emit_result();
	return res->get_string(0);
}

