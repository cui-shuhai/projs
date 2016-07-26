

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <vector>

#include "SqlAccessor.h"

using namespace std;
class employee_department : public SqlAccessor{

public:
	employee_department();
	employee_department(string department_name,  string description);
	~employee_department();
	
	void add_employee_department();
	void get_employee_departments( std::vector<string> &m);

private:
	string department_name;
	string description;
};
