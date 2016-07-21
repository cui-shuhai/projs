
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "mysqlite.h"

using namespace std;
class exist_task : public mysqlite{

public:
	exist_task();
	exist_task(int task_id, string task_name, string due_date, int status, string description, int assignee, int assigner, int creator);
	~exist_task();
	
	void add_exist_task();
	int get_exist_taskId();

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

