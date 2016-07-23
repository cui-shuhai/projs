

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
	case_status(int status, string description);
	~case_status();
	
	void add_case_status();
	void get_case_statuss( std::map<int, string> &m);

private:
	int status;
	string description;
};

