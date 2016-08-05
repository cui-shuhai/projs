
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
#include "shrest_db/task_table.h"

task_table::task_table():SqlAccessor()
{
}

task_table::task_table(string task_id_, string task_name_, string due_date_, string status_, string description_, string assignee_, string assigner_, string creator_):
	SqlAccessor(),
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

task_table::~task_table(){
}

void task_table::add_task_table(){

	auto sql = "INSERT INTO 'task_table'(task_name, due_date, status, description, assignee, assigner, creator) VALUES(?, ?, ?, ?, ?, ?, ?)";

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

void task_table::update_task_table()
{
	stringstream ss;
	ss <<  "UPDATE task_table SET ";
	ss << "task_id = " << "\"" << task_id << "\"" << ",";
	ss << "task_name = " << "\"" << task_name << "\"" << ",";
	ss << "due_date = " << "\"" << due_date << "\"" << ",";
	ss << "status = " << "\"" << status << "\"" << ",";
	ss << "description = " << "\"" << description << "\"" << ",";
	ss << "assignee = " << "\"" << assignee << "\"" << ",";
	ss << "assigner = " << "\"" << assigner << "\"" << ",";
	ss << "creator = " << "\"" << creator << "\"" << ",";
	ss << " WHERE task_id = " <<  "\"" << 	task_id <<  "\"" ;

	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();
}

void task_table::get_task_instance(std::map<string, string> &task)
{

	string sql = "SELECT task_id, task_name, due_date, status, description, assignee, assigner, creator "
	" FROM task_table ";

		sql.append(" WHERE task_id =  '").append( task_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		
		task["task_id"] = res->get_string(0);
		task["task_name"] = res->get_string(1);
		task["due_date"] = res->get_string(2);
		task["status"] = res->get_string(3);
		task["description"] = res->get_string(4);
		task["assignee"] = res->get_string(5);
		task["assigner"] = res->get_string(6);
		task["creator"] = res->get_string(7);
}

void task_table::get_task_list(std::map<string, string> &tasks)
{
}

void task_table::get_task_records( string source, string &result )
{
	string sql = "SELECT task_id, task_name, due_date, status, description, assignee, assigner, creator "
	" FROM task_table ";

		if(!source.empty())
		sql.append(" WHERE task_id =  '").append( source ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"recordset\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss << "\"task_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"task_name\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"due_date\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"status\"" << ":" << "\"" << res->get_string(3) << "\"" << ",";
			ss << "\"description\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"assignee\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"assigner\"" << ":" << "\"" << res->get_string(6) << "\"" << ",";
			ss << "\"creator\"" << ":" << "\"" << res->get_string(7) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

