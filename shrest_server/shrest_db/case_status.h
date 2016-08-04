

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class case_status : public SqlAccessor{

public:
	case_status();
	case_status(string status, string description);
	~case_status();
	
	void add_case_status();
	void get_case_statuss( std::map<string, string> &m);

private:
	string status_name;
	string description;
};

