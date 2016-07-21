
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class activity_table : public SqlAccessor{

public:
	activity_table();
	activity_table(int id, int contactType, int contactId, int contacter, const string& date, const string& content);
	~activity_table();
	
	void add_activity_table();
	int get_activity_tableId();

private:
	int event_id;
	int contact_type; 
	int contact_id; 
	int who_contacts; 
	string when_created; 
	string note;
};

