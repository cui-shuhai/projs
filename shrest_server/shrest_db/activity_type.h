

#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class activity_type : public SqlAccessor{

public:
	activity_type();
	activity_type(string type_name, string description);
	~activity_type();
	
	void add_activity_type();
	void get_activity_type( std::vector< string> &m);

private:
	string type_name;
	string description;
};
