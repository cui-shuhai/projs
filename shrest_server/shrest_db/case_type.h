

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class case_type : public SqlAccessor{

public:
	case_type();
	case_type(int type, string description);
	~case_type();
	
	void add_case_type();
	void get_case_types( std::map<int, string> &m);

private:
	int type;
	string description;
};
