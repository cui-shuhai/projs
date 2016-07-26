

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <vector>

#include "SqlAccessor.h"

using namespace std;
class employee_profile : public SqlAccessor{

public:
	employee_profile();
	employee_profile(string profile_name, string description);
	~employee_profile();
	
	void add_employee_profile();
	void get_employee_profiles( std::vector<string> &m);

private:
	string profile_name;
	string description;
};
