
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class task_table : public SqlAccessor{

public:
	task_table();
	task_table(int task_id, string task_name, string due_date, int status, string description, int assignee, int assigner, int creator);
	~task_table();
	
	void add_task_table();
	int get_task_tableId();

private:
	int task_id;
	string task_name;
	string due_date;
	int status;
	string description;
	int assignee;
	int assigner;
	int creator;
};

