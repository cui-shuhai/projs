
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

	string sql = "INSERT INTO 'activity'( activity_name, "
		"activity_type,  activity_status,  activity_priority,  "
		"who_preside,  when_created,  note) "
		" VALUES(?, ?, ?,  ?, ?, ?, ?)";


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

void activity_table::get_activity_records( string source, string &result ){

		string count_sql = "SELECT count(1) "
			" FROM activity INNER JOIN activity_type ON activity_type.activity_type = activity.activity_type INNER JOIN "
			" activity_status  ON activity_status.activity_status = activity.activity_status INNER JOIN "
			" activity_priority ON activity_priority.activity_priority = activity.activity_priority ";

		query count_query(*conn, count_sql);
		auto count_res = count_query.emit_result();
		if( count_res->get_int(0) == 0)
			return;
		

		string sql = "SELECT activity_id, activity_name, activity_type.description, activity_status.description,"
			" activity_priority.description, who_preside, when_created, note "
			" FROM activity INNER JOIN activity_type ON activity_type.activity_type = activity.activity_type INNER JOIN "
			" activity_status  ON activity_status.activity_status = activity.activity_status INNER JOIN "
			" activity_priority ON activity_priority.activity_priority = activity.activity_priority ";

			
		if(!source.empty())
		sql.append("WHERE activity_type.description = ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();

		stringstream ss;

		//XXX should check count in case it is 0. there is a bug form sqlite count doesn't work

		bool first = true;
		ss << "{ \"activity\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}

			ss << "{" ;
			ss << "\"activity_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"activity_name\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"activity_type\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"activity_status\"" << ":" << "\"" << res->get_string(3) << "\"" << ",";
			ss << "\"activity_priority\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"who_preside\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"when_created\"" << ":" << "\"" << res->get_string(6) << "\"" << ",";
			ss << "\"note\"" << ":" << "\"" << res->get_string(7) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

void activity_table::update_table(){

	stringstream ss;
	ss << "activity_id = " << "\"" << activity_id << "\"" << ",";
	ss << "activity_name = " << "\"" << activity_name << "\"" << ",";
	ss << "activity_type = " << "\"" << activity_type << "\"" << ",";
	ss << "activity_status = " << "\"" << activity_status << "\"" << ",";
	ss << "activity_priority = " << "\"" << activity_priority << "\"" << ",";
	ss << " WHERE activity_id = " << 	activity_id ;


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();
}

void activity_table::get_activity_instance(std::map<string, string> &activity){

		string sql = "SELECT activity_id, activity_name, activity_type.description, activity_status.description,"
			" activity_priority.description, who_preside, when_created, note "
			" FROM activity INNER JOIN activity_type ON activity_type.activity_type = activity.activity_type INNER JOIN "
			" activity_status  ON activity_status.activity_status = activity.activity_status INNER JOIN "
			" activity_priority ON activity_priority.activity_priority = activity.activity_priority  WHERE activity_id = ";

		sql.append( to_string( activity_id ));
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		;
		activity["activity_id"] = to_string( res->get_int(0) );
		activity["activity_name"] = res->get_string(1) ;
		activity["activity_type"] = res->get_string(2) ;
		activity["activity_status"] = res->get_string(3) ;
		activity["activity_priority"] = res->get_string(4) ;
		activity["who_preside"] = res->get_string(5) ;
		activity["when_created"] = res->get_string(6) ;
		activity["note"] = res->get_string(7);
}
