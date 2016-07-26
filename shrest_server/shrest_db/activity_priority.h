

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class activity_priority : public SqlAccessor{

public:
	activity_priority();
	activity_priority(int priority_id, string description);
	~activity_priority();
	
	void add_activity_priority();
	void get_activity_priority( std::map<int, string> &m);

private:
	int priority_id;
	string description;
};
