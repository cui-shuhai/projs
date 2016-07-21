
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "mysqlite.h"

using namespace std;
class contact_activity : public mysqlite{

public:
	contact_activity();
	contact_activity(int id, int contactType, int contactId, int contacter, const string& date, const string& content);
	~contact_activity();
	
	void add_contact_activity();
	int get_contact_activityId();

private:
	int event_id;
	int contact_type; 
	int contact_id; 
	int who_contacts; 
	string when_created; 
	string note;
};

