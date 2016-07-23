

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class case_reason : public SqlAccessor{

public:
	case_reason();
	case_reason(int reason, string description);
	~case_reason();
	
	void add_case_reason();
	void get_case_reasons( std::map<int, string> &m);

private:
	int reason;
	string description;
};

