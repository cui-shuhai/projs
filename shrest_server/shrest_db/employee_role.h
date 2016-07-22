

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class employee_role : public SqlAccessor{

public:
	employee_role();
	employee_role(int role_id, string name, string description);
	~employee_role();
	
	void add_employee_role();
	void get_employee_roles( std::map<int, string> &m);

private:
	int role_id;
	string name;
	string description;
};
