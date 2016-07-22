

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class activity_status : public SqlAccessor{

public:
	activity_status();
	activity_status(int status_id, string description);
	~activity_status();
	
	void add_activity_status();
	void get_activity_status( std::map<int, string> &m);

private:
	int status_id;
	string description;
};
