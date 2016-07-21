
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "mysqlite.h"

using namespace std;
class cookie_table : public mysqlite{

public:
	cookie_table();
	cookie_table(string sessionId, string username, string password);
	~cookie_table();
	
	void add_cookie_table();
	bool get_cookie_user(const string & session, string &user, string &password);

private:
	string session_id;
	string user_name;
	string pass_word;
};

