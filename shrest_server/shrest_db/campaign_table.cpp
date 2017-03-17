
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
#include "shrest_db/campaign_table.h"

campaign_table::campaign_table():SqlAccessor()
{}

campaign_table::campaign_table(string id):SqlAccessor(),
	campaign_id(id)
{}

campaign_table::campaign_table( string campaign_id_, string campaign_name_, string assign_to_, string campaign_status_, string creator_id_, string start_date_, string close_date_, string description_):SqlAccessor(),
	 campaign_id{campaign_id_},
	 campaign_name{campaign_name_},
	 assign_to{assign_to_},
	 campaign_status{campaign_status_},
	 creator_id{creator_id_},
	 start_date{start_date_},
	 close_date{close_date_},
	 description{description_}
{ }

campaign_table::~campaign_table(){}

void campaign_table::add_campaign_table(){

	string sql = "INSERT INTO 'campaign'( campaign_name, assign_to, campaign_status, creator_id, start_date, close_date, description ) VALUES(?,?, ? ?, ?,?, ? )";

	command c(*conn, sql);
	c.bind(1, campaign_name);
	c.bind(2, assign_to);
	c.bind(3, campaign_status);
	c.bind(4, creator_id);
	c.bind(5, start_date);
	c.bind(6, close_date);
	c.bind(7, description);
	c.emit();
}
void campaign_table::get_campaign_instance(std::map<string, string> &campaign){


	string sql = "SELECT campaign_id, campaign_name, assign_to, campaign_status, creator_id, start_date, close_date, description "
	" FROM campaign  WHERE campaign_id = ";

		sql.append("'").append( campaign_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		campaign["campaign_id"] = res->get_string(0);
		campaign["campaign_name"] = res->get_string(1);
		campaign["assign_to"] = res->get_string(2);
		campaign["campaign_status"] = res->get_string(3);
		campaign["creator_id"] = res->get_string(4);
		campaign["start_date"] = res->get_string(5);
		campaign["close_date"] = res->get_string(6);
		campaign["description"] = res->get_string(7);
}
void campaign_table::get_campaign_records( string source, string &result ){

	string sql = "SELECT campaign_id, campaign_name, assign_to, campaign_status, creator_id, start_date, close_date, description "
	" FROM campaign  ";


		if(!source.empty())
		sql.append("WHERE campaign_id = ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"campaign\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
						ss << "{" ;
			ss << "\"campaign_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"campaign_name\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"assign_to\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"campaign_status\"" << ":" << "\"" << res->get_string(3) << "\"" << ",";
			ss << "\"creator_id\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"start_date\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"close_date\"" << ":" << "\"" << res->get_string(6) << "\"" << ",";
			ss << "\"description\"" << ":" << "\"" << res->get_string(7) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

void campaign_table::update_campaign_table(){


	stringstream ss;
	 ss <<  "UPDATE campaign SET ";
		ss << "campaign_id = " << "\"" << campaign_id << "\"" << ",";
		ss << "campaign_name = " << "\"" << campaign_name << "\"" << ",";
		ss << "assign_to = " << "\"" << assign_to << "\"" << ",";
		ss << "campaign_status = " << "\"" << campaign_status << "\"" << ",";
		ss << "creator_id = " << "\"" << creator_id << "\"" << ",";
		ss << "start_date = " << "\"" << start_date << "\"" << ",";
		ss << "close_date = " << "\"" << close_date << "\"" << ",";
		ss << "description = " << "\"" << description << "\"" ;
		ss << " WHERE campaign_id = " <<  "\"" << 	campaign_id <<  "\"" ;


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();

}

void campaign_table::get_campaign_statuss(std::vector<string> &m)
{
	string sql = "SELECT status_name FROM campaign_status";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
