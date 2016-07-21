
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class user_table : public SqlAccessor{

public:
	user_table();
	user_table(const string& loginName);
	user_table(const string& loginName, const string &pass, int employeeId, string& rl, int p);
	~user_table();
	
	void add_user_table();
	bool change_user_password(const string & loginName, const string &password) const;
	bool update_user(const string& loginName, const string &pass, int employeeId, string& rl, int p);

	bool check_user_exist();
	bool check_login_exist();


	void set_login_name(string login_name_){ login_name = login_name_;}
	void set_pass_word(string pass_word_){ pass_word = pass_word_;}
	void set_employee_id(int employee_id_){ employee_id = employee_id_;}
	void set_role(string role_){ role = role_;}
	void set_profile(int profile_){ profile = profile_;}
	void set_when(string when_){ when = when_;}

	string get_login_name(){ return login_name;}
	string get_pass_word(){ return pass_word;}
	int get_employee_id(){ return employee_id;}
	string get_role(){ return role;}
	int get_profile(){ return profile;}
	string get_when(){ return when;}

private:
	string login_name;
	string pass_word;
	int employee_id;
	string role;
	int profile;
	string when;
};


