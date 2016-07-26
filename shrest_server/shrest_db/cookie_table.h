
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class cookie_table : public SqlAccessor{

public:
	cookie_table();
	cookie_table(const string& sessionId);
	cookie_table(const string& sessionId, const string& username, const string& password);
	~cookie_table();
	
	void add_cookie_table();
	void delete_cookie_table();
	bool get_cookie_user();
	string get_user_id();

	string  get_session_id() { return session_id;}
	string  get_user_name() { return user_name;}
	string  get_pass_word() { return pass_word;}

private:
	string session_id;
	string user_name;
	string pass_word;
};

