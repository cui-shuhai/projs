
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

cookie_table::cookie_table():mysqlite()
{
}

cookie_table::cookie_table(string sessionId, string username, string password):
	mysqlite(),
	 session_id{sessionId},
	 user_name{username},
	 pass_word{password}
{
}

cookie_table::~cookie_table(){
}

void cookie_table::add_cookie_table(){

	string sql = "INSERT INTO 'cookie'(session_id, user_name, password) VALUES(?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, session_id);
	c.bind(2, user_name);
	c.bind(3, pass_word);
	c.emit();
}

bool cookie_table::get_cookie_user(const string & session, string &user, string &password)
{	
		
	string sql = "user_name, password FROM cookie where session_id == ";
	sql.append(session);

	query cookie_query(*conn, sql);

	auto res = cookie_query.emit_result();
	user = res->get_string(0);
	password = res->get_string(1);		
}
