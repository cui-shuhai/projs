
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
#include "shrest_db/contact_activity.h"

contact_activity::contact_activity():mysqlite()
{
}

contact_activity::contact_activity(int id, int contactType, int contactId, int contacter, const string& date, const string& content):
	mysqlite(),
	event_id{id},
	contact_type{contactType},
	contact_id{contactId},
	who_contacts{contacter},
	when_created{date},
	note{content}
{
}

contact_activity::~contact_activity(){
}

void contact_activity::add_contact_activity(){

	auto sql = "INSERT INTO 'activity_event'(contact_type, contact_id, who_contacts, when_created, note) VALUES(?, ?, ?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, contact_type);
	c.bind(2, contact_id);
	c.bind(2, who_contacts);
	c.bind(4, when_created);
	c.bind(5, note);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	event_id = id_res->get_int(0);
}

int contact_activity::get_contact_activityId()
{	
	return event_id;
}
