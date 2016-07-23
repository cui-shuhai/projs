
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class case_table : public SqlAccessor{

public:
	case_table();
	case_table(int id);
	case_table( int case_id, int assign_to, int contact, string subject, int priority, int status, int type, int reason, string last_activity, string next_activity);
	~case_table();
	
	int get_case_id(){ return case_id; }
	int get_assign_to(){ return assign_to; }
	int get_contact(){ return contact; }
	string get_subject(){ return subject; }
	int get_priority(){ return priority; }
	int get_status(){ return status; }
	int get_type(){ return type; }
	int get_reason(){ return reason; }
	string get_last_activity(){ return last_activity; }
	string get_next_activity(){ return next_activity; }

	void set_case_id(int case_id_){ case_id_ = case_id; }
	void set_assign_to(int assign_to_){ assign_to_ = assign_to; }
	void set_contact(int contact_){ contact_ = contact; }
	void set_subject(string subject_){ subject_ = subject; }
	void set_priority(int priority_){ priority_ = priority; }
	void set_status(int status_){ status_ = status; }
	void set_type(int type_){ type_ = type; }
	void set_reason(int reason_){ reason_ = reason; }
	void set_last_activity(string last_activity_){ last_activity_ = last_activity; }
	void set_next_activity(string next_activity_){ next_activity_ = next_activity; }

	void add_case_table();

private:
	int case_id;
	int assign_to;
	int contact;
	string subject;
	int priority;
	int status;
	int type;
	int reason;
	string last_activity;
	string next_activity;
};

