
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
#include "shrest_db/activity_table.h"

activity_table::activity_table():SqlAccessor()
{
}

activity_table::activity_table( int activity_id_, string activity_name_, int activity_type_, int activity_status_, int activity_priority_, int who_preside_, string when_created_, string note_):
	SqlAccessor(),
	activity_id{ activity_id_ },
	activity_name{ note_ },
	activity_type{ activity_type_ },
	activity_status{ activity_status_ },
	activity_priority{ activity_priority_ },
	who_preside{ who_preside_ },
	when_created( when_created_ ),
	note( note_ )
{
}

activity_table::~activity_table(){
}

void activity_table::add_activity_table(){

	auto sql = "INSERT INTO 'activity_event'( activity_name "
		"activity_type,  activity_status,  activity_priority,  "
		"who_preside,  when_created,  note "
		"VALUES(? ?, ? ?, ?, ?, ?)";

	command c(*conn, sql);

	c.bind(1, activity_name);
	c.bind(2, activity_type);
	c.bind(3, activity_status);
	c.bind(4, activity_priority);
	c.bind(5, who_preside);
	c.bind(6, when_created);
	c.bind(7, note);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	activity_id = id_res->get_int(0);
}

int activity_table::get_activity_tableId()
{	
	return activity_id;
}
