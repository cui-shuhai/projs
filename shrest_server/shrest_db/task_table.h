
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class task_table : public SqlAccessor{

public:
	task_table();
	task_table(string task_id, string task_name, string due_date, string status, string description, string assignee, string assigner, string creator);
	~task_table();
	
	void add_task_table();
	void update_task_table();
	void get_task_instance(std::map<string, string> &task);
	void get_task_list(std::map<string, string> &tasks);
	void get_task_records( string source, string &result );


	string get_task_id(){ return task_id;}
	string get_task_name(){ return task_name;}
	string get_due_date(){ return due_date;}
	string get_status(){ return status;}
	string get_description(){ return description;}
	string get_assignee(){ return assignee;}
	string get_assigner(){ return assigner;}
	string get_creator(){ return creator;}


	void set_task_id(string task_id_){ task_id = task_id_;}
	void set_task_name(string task_name_){ task_name = task_name_;}
	void set_due_date(string due_date_){ due_date = due_date_;}
	void set_status(string status_){ status = status_;}
	void set_description(string description_){ description = description_;}
	void set_assignee(string assignee_){ assignee = assignee_;}
	void set_assigner(string assigner_){ assigner = assigner_;}
	void set_creator(string creator_){ creator = creator_;}
private:
	string task_id;
	string task_name;
	string due_date;
	string status;
	string description;
	string assignee;
	string assigner;
	string creator;
};


