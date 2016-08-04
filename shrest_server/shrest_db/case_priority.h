

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class case_priority : public SqlAccessor{

public:
	case_priority();
	case_priority(string priority_name, string description);
	~case_priority();
	
	void add_case_priority();
	void get_case_prioritys( std::map<string, string> &m);

private:
	string priority_name;
	string description;
};

