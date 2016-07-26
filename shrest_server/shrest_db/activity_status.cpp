

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
#include "shrest_db/activity_status.h"

activity_status::activity_status():SqlAccessor()
{
}

activity_status::activity_status(int status_id_, string description_):
	SqlAccessor(),
	status_id{status_id_},
	description{description_}
{
}

activity_status::~activity_status(){
}

void activity_status::add_activity_status(){

	auto sql = "INSERT INTO 'activity_status'(activity_status, description) VALUES(?, ?)";

	command c(*conn, sql);
	c.bind(1, status_id);
	c.bind(2, description);

	c.emit();

}

void activity_status::get_activity_status( vector<string> &m)
{	
	string sql = "SELECT activity_status FROM activity_status";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
