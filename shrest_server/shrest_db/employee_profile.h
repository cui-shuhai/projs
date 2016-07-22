

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class employee_profile : public SqlAccessor{

public:
	employee_profile();
	employee_profile(int profile_id, string name, string description);
	~employee_profile();
	
	void add_employee_profile();
	void get_employee_profiles( std::map<int, string> &m);

private:
	int profile_id;
	string name;
	string description;
};
