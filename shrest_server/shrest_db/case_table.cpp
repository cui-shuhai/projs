
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
#include "shrest_db/case_table.h"

case_table::case_table():SqlAccessor()
{}

case_table::case_table(string id):SqlAccessor(),
	case_id(id)
{}

case_table::case_table( string case_id_, string assign_to_, string contact_, string subject_, string priority_, string status_, string type_, string reason_, string last_activity_, string next_activity_):
	SqlAccessor(),
	case_id{ case_id_ },
	assign_to{ assign_to_ },
	contact{ contact_ },
	subject{ subject_ },
	priority{ priority_ },
	status{ status_ },
	type{ type_ },
	reason{ reason_ },
	last_activity{ last_activity_},
	next_activity{ next_activity_}
{ }

case_table::~case_table(){}

void case_table::add_case_table(){

	string sql = "INSERT INTO 'case_tbl'( assign_to, contact, subject, priority, status, type, reason, last_activity, next_activity )"
			 "VALUES(?,?, ? ?, ?,?, ?, ?, ? )";

	command c(*conn, sql);
	c.bind(1, assign_to);
	c.bind(2, contact);
	c.bind(3, subject);
	c.bind(4, priority);
	c.bind(5, status);
	c.bind(6, type);
	c.bind(7, reason);
	c.bind(8, last_activity);
	c.bind(9, next_activity);

	c.emit();

	string id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	case_id  = id_res->get_int(0);
}

void case_table::update_case_table()
{


	stringstream ss;
	 ss <<  "UPDATE cast_tbl SET ";
		ss << "case_id = " << "\"" << case_id << "\"" << ","; 
		ss << "assign_to = " << "\"" << assign_to << "\"" << ","; 
		ss << "contact = " << "\"" << contact << "\"" << ","; 
		ss << "subject = " << "\"" << subject << "\"" << ","; 
		ss << "priority = " << "\"" << priority << "\"" << ","; 
		ss << "status = " << "\"" << status << "\"" << ","; 
		ss << "type = " << "\"" << type << "\"" << ","; 
		ss << "reason = " << "\"" << reason << "\"" << ","; 
		ss << "last_activity = " << "\"" << last_activity << "\"" << ","; 
		ss << "next_activity = " << "\"" << next_activity << "\""; 

	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();
}

void case_table::get_case_instance(std::map<string, string> &cases)
{

	string sql = "SELECT case_id, assign_to, contact, subject, priority, status, type, reason, last_activity, next_activity "
	" FROM case_tbl  WHERE case_id = ";

		sql.append("'").append( case_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		cases["case_id"] = res->get_string(0);
		cases["assign_to"] = res->get_string(1);
		cases["contact"] = res->get_string(2);
		cases["subject"] = res->get_string(3);
		cases["priority"] = res->get_string(4);
		cases["status"] = res->get_string(5);
		cases["type"] = res->get_string(6);
		cases["reason"] = res->get_string(7);
		cases["last_activity"] = res->get_string(8);
		cases["next_activity"] = res->get_string(9);
}

void case_table::get_case_records( string source, string &result )
{

	string sql = "SELECT case_id, assign_to, contact, subject, priority, status, type, reason, last_activity, next_activity "
	" FROM case_tbl";


		if(!source.empty())
		sql.append("WHERE case_id = ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"cases\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss << "\"case_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"assign_to\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"contact\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"subject\"" << ":" << "\"" << res->get_string(3) << "\"" << ",";
			ss << "\"priority\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"status\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"type\"" << ":" << "\"" << res->get_string(6) << "\"" << ",";
			ss << "\"reason\"" << ":" << "\"" << res->get_string(7) << "\"" << ",";
			ss << "\"last_activity\"" << ":" << "\"" << res->get_string(8) << "\"" << ",";
			ss << "\"next_activity\"" << ":" << "\"" << res->get_string(9) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}


