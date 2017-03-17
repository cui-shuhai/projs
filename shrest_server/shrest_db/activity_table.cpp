
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

activity_table::activity_table( string activity_id_, string activity_name_, string activity_type_, string activity_status_, string activity_priority_, string who_preside_, string when_created_, string note_):
	SqlAccessor(),
	activity_id{ activity_id_ },
	activity_name{ activity_name_},
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

	stringstream ss;
	string sql = "INSERT INTO 'activity'( activity_id, activity_name, "
		"activity_type,  activity_status,  activity_priority,  "
		"who_preside,  when_created,  note) "
		" VALUES( "; 

	ss << sql;
	ss << "'" <<  activity_id << "'" << ",";
	ss << "'" <<  activity_name << "'" << ",";
	ss << "'" <<  activity_type << "'" << ",";
	ss << "'" <<  activity_status << "'" << ",";
	ss << "'" <<  activity_priority << "'" << ",";
	ss << "'" <<  who_preside << "'" << ",";
	ss << "'" <<  when_created << "'" << ",";
	ss << "'" <<  note << "'" << ")";

	sql = ss.str();
	LOG("add activity: ", sql);
	command c(*conn, sql);
	c.emit();
}

void activity_table::get_activity_records( string source, string &result ){

		string count_sql = "SELECT count(1) "
			" FROM activity ";

		if(!source.empty())
			count_sql.append("WHERE activity_type = ").append(source);

		query count_query(*conn, count_sql);
		auto count_res = count_query.emit_result();
		if( count_res->get_int(0) == 0)
			return;
		

		string sql = "SELECT activity_id, activity_name, activity_type, activity_status, "
			" activity_priority, who_preside, when_created, note "
			" FROM activity ";

			
		if(!source.empty())
			sql.append("WHERE activity_type = ").append(source);

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
	ss << "UPDATE activity SET ";
	ss << "activity_name = " << "'" << activity_name << "'"  << ",";
	ss << "activity_type = " << "'" << activity_type << "'" <<",";
	ss << "activity_status = " << "'" << activity_status << "'" << ",";
	ss << "activity_priority = " << "'" << activity_priority  << "'"  ;
	ss << " WHERE activity_id = " << "'" << activity_id << "'";


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();
}

void activity_table::get_activity_instance(std::map<string, string> &activity){

		string sql = "SELECT activity_id, activity_name, activity_type, activity_status, "
			" activity_priority, who_preside, when_created, note "
			" FROM activity WHERE activity_id = ";

		sql.append("'").append( activity_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		;
		activity["activity_id"] =  res->get_string(0);
		activity["activity_name"] = res->get_string(1) ;
		activity["activity_type"] = res->get_string(2) ;
		activity["activity_status"] = res->get_string(3) ;
		activity["activity_priority"] = res->get_string(4) ;
		activity["who_preside"] = res->get_string(5) ;
		activity["when_created"] = res->get_string(6) ;
		activity["note"] = res->get_string(7);
}

void activity_table::get_activity_status( vector<string> &m)

{	
	string sql = "SELECT activity_status FROM activity_status";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
void activity_table::get_activity_priority( vector<string> &m)
{	
	string sql = "SELECT activity_priority FROM activity_priority";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
void activity_table::get_activity_type( vector< string> &m)
{	
	string sql = "SELECT activity_type, description FROM activity_type";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
