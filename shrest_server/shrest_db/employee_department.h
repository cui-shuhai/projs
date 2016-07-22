

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class employee_department : public SqlAccessor{

public:
	employee_department();
	employee_department(int employee_id, string name, string description);
	~employee_department();
	
	void add_employee_department();
	void get_employee_departments( std::map<int, string> &m);

private:
	int employee_id;
	string name;
	string description;
};
