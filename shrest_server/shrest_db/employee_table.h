
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class employee_table : public SqlAccessor{

public:
	employee_table();
	employee_table(string employee_id, string first_name, string last_name, 
			int age, string address, string mobile_phone,
			string office_phone, string home_phone, string email, 
			string job_title, string department_name, string reports_to, string create_date, string created_by);

	~employee_table();

	string get_employee_id(){ return employee_id; }
	string get_first_name(){ return first_name; }
	string get_last_name(){ return last_name; }
	int get_age(){ return age; }
	string get_address(){ return address; }
	string get_mobile_phone(){ return mobile_phone; }
	string get_office_phone(){ return office_phone; }
	string get_home_phone(){ return home_phone; }
	string get_email(){ return email; }
	string get_job_title(){ return job_title; }
	string get_department_name(){ return department_name; }
	string get_reports_to(){ return reports_to; }
	string get_create_date(){ return create_date; }
	string get_created_by(){ return created_by; }
	
	void add_employee_table();
	void get_department_managers(std::map<string, string> &managers);
	void get_employee_list(std::map<string, string> &employees);
	void get_employee_records( string source, string &result );

private:
	string employee_id;
	string first_name;
	string last_name;
	int age;
	string address;
	string mobile_phone;
	string office_phone;
	string home_phone;
	string email;
	string job_title;
	string department_name;
	string reports_to;
	string create_date;
	string created_by;
};

