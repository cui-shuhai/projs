
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
		 string employeeId, string role, string profile,
		 string w, string c_id);

	~user_table();
	
	void add_user_table();
	bool change_user_password(const string & loginName, const string &password) const;
	bool update_user(const string& loginName, const string &pass, string employeeId, string rl, string p);
	void update_user_table();

	bool check_user_exist();
	bool check_login_exist();
	void get_user_list( map<string, string> &m);
	void get_user_records( string source, string &result );
	void get_user_roles( string source, string &result );
	void get_user_profiles( string source, string &result );


	void set_login_name(string login_name_){ login_name = login_name_;}
	void set_pass_word(string pass_word_){ pass_word = pass_word_;}
	void set_employee_id(string employee_id_){ employee_id = employee_id_;}
	void set_role_name(string role_name_){ role_name = role_name_;}
	void set_profile_name(string profile_name_){ profile_name = profile_name_;}
	void set_create_date(string create_date_){ create_date = create_date_;}
	void set_creator_id(string creator_id_){ creator_id = creator_id_;}

	string get_login_name(){ return login_name;}
	string get_pass_word(){ return pass_word;}
	string get_employee_id(){ return employee_id;}
	string get_role_name(){ return role_name;}
	string get_profile_name(){ return profile_name;}
	string get_create_date(){ return create_date;}
	string get_creator_id(){ return creator_id;}

private:
	string login_name;
	string pass_word;
	string employee_id;
	string role_name;
	string profile_name;
	string create_date;
	string creator_id;
};

