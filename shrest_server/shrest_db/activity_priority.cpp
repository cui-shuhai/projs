

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
#include "shrest_db/activity_priority.h"

activity_priority::activity_priority():SqlAccessor()
{
}

activity_priority::activity_priority(int priority_id_, string description_):
	SqlAccessor(),
	priority_id{priority_id_},
	description{description_}
{
}

activity_priority::~activity_priority(){
}

void activity_priority::add_activity_priority(){

	auto sql = "INSERT INTO 'activity_priority'(activity_priority, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, priority_id);
	c.bind(2, description);

	c.emit();

}

void activity_priority::get_activity_priority( map<int, string> &m)
{	
	string sql = "SELECT activity_priority, description FROM activity_priority";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}
