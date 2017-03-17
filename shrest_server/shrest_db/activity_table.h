
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class activity_table : public SqlAccessor{

public:
	activity_table();
	activity_table( string activity_id, string activity_name, 
		string activity_type, string activity_status, string activity_priority, 
		string who_preside, string when_created, string note);
	~activity_table();

	void get_activity_priority( std::vector<string> &m);
	void get_activity_status( std::vector<string> &m);
	void get_activity_type( std::vector< string> &m);


	void set_activity_id(string activity_id_){ activity_id = activity_id_; }
	void set_activity_name(string activity_name_){ activity_name = activity_name_; }
	void set_activity_type(string activity_type_){ activity_type = activity_type_; }
	void set_activity_status(string activity_status_){ activity_status = activity_status_; }
	void set_activity_priority(string activity_priority_){ activity_priority = activity_priority_; }
	void set_who_preside(string who_preside_){ who_preside = who_preside_; }
	void set_when_created(string when_created_){ when_created = when_created_; }
	void set_note(string note_){ note = note_; }
	string get_activity_id(){ return activity_id; }
	string get_activity_name(){ return activity_name; }
	string get_activity_type(){ return activity_type; }
	string get_activity_status(){ return activity_status; }
	string get_activity_priority(){ return activity_priority; }
	string get_who_preside(){ return who_preside; }
	string get_when_created(){ return when_created; }
	string get_note(){ return note; }
	
	void add_activity_table();
	void get_activity_records( string source, string &result );
	void update_table();
	void get_activity_instance(std::map<string, string> &activity);
private:
	string activity_id;
	string activity_name;
	string activity_type;
	string activity_status;
	string activity_priority;
	string who_preside;
	string when_created;
	string note;
};


