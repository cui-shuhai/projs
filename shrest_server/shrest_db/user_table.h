
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
	user_table(const string& loginName, const string &pass,
		 int employeeId, int role, int profile,
		 string w, int c_id);

	~user_table();
	
	void add_user_table();
	bool change_user_password(const string & loginName, const string &password) const;
	bool update_user(const string& loginName, const string &pass, int employeeId, int rl, int p);

	bool check_user_exist();
	bool check_login_exist();


	void set_login_name(string login_name_){ login_name = login_name_;}
	void set_pass_word(string pass_word_){ pass_word = pass_word_;}
	void set_employee_id(int employee_id_){ employee_id = employee_id_;}
	void set_role_id(int role_id_){ role_id = role_id_;}
	void set_profile_id(int profile_id_){ profile_id = profile_id_;}
	void set_create_date(string create_date_){ create_date = create_date_;}
	void set_creator_id(int creator_id_){ creator_id = creator_id_;}

	string get_login_name(){ return login_name;}
	string get_pass_word(){ return pass_word;}
	int get_employee_id(){ return employee_id;}
	int get_role_id(){ return role_id;}
	int get_profile_id(){ return profile_id;}
	string get_create_date(){ return create_date;}
	int get_creator_id(){ return creator_id;}

private:
	string login_name;
	string pass_word;
	int employee_id;
	int role_id;
	int profile_id;
	string create_date;
	int creator_id;
};

