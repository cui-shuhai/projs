
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class case_table : public SqlAccessor{

public:
	case_table();
	case_table(string id);
	case_table( string case_id, string assign_to, string contact, string subject, string priority, string case_status, string type, string reason, string last_activity, string next_activity);
	~case_table();
	
	string get_case_id(){ return case_id; }
	string get_assign_to(){ return assign_to; }
	string get_contact(){ return contact; }
	string get_subject(){ return subject; }
	string get_priority(){ return priority; }
	string get_case_status(){ return case_status; }
	string get_type(){ return type; }
	string get_reason(){ return reason; }
	string get_last_activity(){ return last_activity; }
	string get_next_activity(){ return next_activity; }

	void set_case_id(string case_id_){ case_id = case_id_; }
	void set_assign_to(string assign_to_){ assign_to = assign_to_; }
	void set_contact(string contact_){ contact = contact_; }
	void set_subject(string subject_){ subject = subject_; }
	void set_priority(string priority_){ priority = priority_; }
	void set_case_status(string case_status_){ case_status = case_status_; }
	void set_type(string type_){ type = type_; }
	void set_reason(string reason_){ reason = reason_; }
	void set_last_activity(string last_activity_){ last_activity = last_activity_; }
	void set_next_activity(string next_activity_){ next_activity = next_activity_; }

	void add_case_table();
	void update_case_table();
	void get_case_instance(std::map<string, string> &cases);
	void get_case_records( string source, string &result );

private:
	string case_id;
	string assign_to;
	string contact;
	string subject;
	string priority;
	string case_status;
	string type;
	string reason;
	string last_activity;
	string next_activity;
};

