
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_log.h"
#include "shrest_db/exist_task.h"

exist_task::exist_task():mysqlite()
{
}

exist_task::exist_task(int task_id_, string task_name_, string due_date_, int status_, string description_, int assignee_, int assigner_, int creator_):
	mysqlite(),
	 task_id{task_id_},
	 task_name{task_name_},
	 due_date{due_date_},
	 status{status_},
	 description{description_},
	 assignee{assignee_},
	 assigner{assigner_},
	 creator{creator_}
{
}

exist_task::~exist_task(){
}

void exist_task::add_exist_task(){

	auto sql = "INSERT INTO 'exist_task'(task_name, due_date, status, description, assignee, assigner, creator) VALUES(?, ?, ?, ?, ?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, task_name);
	c.bind(2, due_date);
	c.bind(3, status);
	c.bind(4, description);
	c.bind(5, assignee);
	c.bind(6, assigner);
	c.bind(7, creator);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	task_id = id_res->get_int(0);

}

int exist_task::get_exist_taskId()
{	
	return task_id;
}
