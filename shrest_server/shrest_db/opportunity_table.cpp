
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
#include "shrest_db/opportunity_table.h"

opportunity_table::opportunity_table():SqlAccessor()
{
}

opportunity_table::opportunity_table( string opportunity_id_, string opportunity_name_, string assign_to_, string contact_id_, string creator_id_, string close_date_, string pipeline_, double amount_, string probablity_):
	SqlAccessor(),
	opportunity_id{opportunity_id_},
	opportunity_name{opportunity_name_},
	assign_to{assign_to_},
	contact_id{contact_id_},
	creator_id{creator_id_},
	close_date{close_date_},
	pipeline{pipeline_},
	amount{amount_},
	probablity{probablity_}
{
}

opportunity_table::~opportunity_table(){
}
void opportunity_table::add_opportunity_table(){

	string sql = "INSERT INTO 'opportunity'(opportunity_name, assign_to, contact_id, creator_id, close_date, pipeline, amount, probablity, opportunity_id) VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?)"; 

	command c(*conn, sql);
	c.bind(1, opportunity_name);
	c.bind(2, assign_to);
	c.bind(3, contact_id);
	c.bind(4, creator_id);
	c.bind(5, close_date);
	c.bind(6, pipeline);
	c.bind(7, amount);
	c.bind(8, probablity);
	c.bind(9, opportunity_id);

	c.emit();
}

void opportunity_table::get_opportunity_instance(std::map<string, string> &opportunity){


	string sql = "SELECT opportunity_name, assign_to, "
		"contact_id, creator_id, close_date, pipeline, amount, probablity  "
	" FROM opportunity  WHERE opportunity_id = ";

		sql.append("'").append( opportunity_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		opportunity["opportunity_id"] = opportunity_id; 
		opportunity["opportunity_name"] = res->get_string(0);
		opportunity["assign_to"] = res->get_string(1);
		opportunity["contact_id"] = res->get_string(2);
		opportunity["creator_id"] = res->get_string(3);
		opportunity["close_date"] = res->get_string(4);
		opportunity["pipeline"] = res->get_string(5);
		opportunity["amount"] = to_string(res->get_double(6));
		opportunity["probablity"] = res->get_string(7);
}

void opportunity_table::update_opportunity_table(){

	stringstream ss;
	ss <<  "UPDATE opportunity SET ";
	ss << "opportunity_name =" << "\"" << opportunity_name << "\"" << ","; 
	ss << "assign_to =" << "\"" << assign_to << "\"" << ","; 
	ss << "contact_id =" << "\"" << contact_id << "\"" << ","; 
	ss << "creator_id =" << "\"" << creator_id << "\"" << ","; 
	ss << "close_date =" << "\"" << close_date << "\"" << ","; 
	ss << "pipeline =" << "\"" << pipeline << "\"" << ","; 
	ss << "amount =" << "\"" << amount << "\"" << ","; 
	ss << "probablity =" << "\"" << probablity << "\""; 
	ss << " WHERE opportunity_id = " << "\"" <<  opportunity_id << "\"";


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();

}

void opportunity_table::get_opportunity_records( string source, string &result ){

	string sql = "SELECT opportunity_name, assign_to, "
		"contact_id, creator_id, close_date, pipeline, amount, probablity , opportunity_id  "
	" FROM opportunity "; 

		if(!source.empty())
		sql.append("WHERE opportunity_id = ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"opportunity\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss << "\"opportunity_id\"" << ":" << "\"" <<  res->get_string(8) << "\"" << ","; 
			ss << "\"opportunity_name\"" << ":" << "\"" <<  res->get_string(0) << "\"" << ",";
			ss << "\"assign_to\"" << ":" << "\"" <<  res->get_string(1) << "\"" << ",";
			ss << "\"contact_id\"" << ":" << "\"" <<  res->get_string(2) << "\"" << ",";
			ss << "\"creator_id\"" << ":" << "\"" <<  res->get_string(3) << "\"" << ",";
			ss << "\"close_date\"" << ":" << "\"" <<  res->get_string(4) << "\"" << ",";
			ss << "\"pipeline\"" << ":" << "\"" <<  res->get_string(5) << "\"" << ",";
			ss << "\"amount\"" << ":" << "\"" <<  to_string(res->get_double(6)) << "\"" << ",";
			ss << "\"probablity\"" << ":" << "\"" <<  res->get_string(7) << "\""; 
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}
void opportunity_table::get_opportunity_pipelines(std::vector<string> &m)
{
	string sql = "SELECT status_name FROM opportunity_pipeline";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
