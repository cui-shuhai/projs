
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
	employee_table(int employee_id, string firstName, string lastName, int age, string address, string mobile_phone, string office_phone, string home_phone, string email, int job_title, int department_id, int reports_to);
	~employee_table();
	
	void add_employee_table();
	int get_employee_tableId();
	void get_department_managers(std::map<int, string> &managers);

private:
	int employee_id;
	string firstName;
	string lastName;
	int age;
	string address;
	string mobile_phone;
	string office_phone;
	string home_phone;
	string email;
	int job_title;
	int department_id;
	int reports_to;
};


