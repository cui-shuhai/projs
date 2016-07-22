
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class activity_table : public SqlAccessor{

public:
	activity_table();
	activity_table( int activity_id, string activity_name, 
		int activity_type, int activity_status, int activity_priority, 
		int who_preside, string when_created, string note);
	~activity_table();
	
	void add_activity_table();
	int get_activity_tableId();

private:
	int activity_id;
	string activity_name;
	int activity_type;
	int activity_status;
	int activity_priority;
	int who_preside;
	string when_created;
	string note;
};


