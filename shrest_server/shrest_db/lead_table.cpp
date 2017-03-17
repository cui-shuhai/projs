
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>
#include <sstream>
#include <string>


#define BOOST_SPIRIT_THREADSAFE

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_utils.h"
#include "lead_table.h"
#include "shrest_log.h"

using namespace std;

lead_table::lead_table():SqlAccessor()
{
}

lead_table::lead_table( string lead_id_, string company_name_, string contact_name_, 
		string personal_title_, string first_name_, string last_name_, 
		string phone_, string email_, string street_addr_, string city_, 
		string state_, string post_code_, string country_, string bill_addr_, 
		string ship_addr_, string lead_source_, string lead_status_, string lead_rating_):
	SqlAccessor(),
	lead_id{ lead_id_ },
	company_name{ company_name_ },
	contact_name{ contact_name_ },
	personal_title{ personal_title_ },
	first_name{ first_name_ },
	last_name{ last_name_ },
	phone{ phone_ },
	email{ email_ },
	street_addr{ street_addr_ },
	city{ city_ },
	state{ state_ },
	post_code{ post_code_ },
	country{ country_ },
	bill_addr{ bill_addr_ },
	ship_addr{ ship_addr_ },
	lead_source{ lead_source_ },
	lead_status{ lead_status_ },
	lead_rating{ lead_rating_ }
{
}

lead_table::~lead_table(){
}

void lead_table::add_lead_table(){

	string sql = "INSERT INTO 'lead'(lead_id , "
		"company_name, contact_name, personal_title, "
		"first_name, last_name, phone, email, street_addr, city, "
		"state, post_code, country, bill_addr, ship_addr, "
		"lead_source, lead_status, lead_rating ) "
		"VALUES( ";

	stringstream ss;
	ss << sql;
	ss << "'" << lead_id << "'" << ", ";
	ss << "'" << company_name << "'" << ", ";
	ss << "'" << contact_name << "'" << ", ";
	ss << "'" << personal_title << "'" << ", ";
	ss << "'" << first_name << "'" << ", ";
	ss << "'" << last_name << "'" << ", ";
	ss << "'" << phone << "'" << ", ";
	ss << "'" << email << "'" << ", ";
	ss << "'" << street_addr << "'" << ", ";
	ss << "'" << city << "'" << ", ";
	ss << "'" << state << "'" << ", ";
	ss << "'" << post_code << "'" << ", ";
	ss << "'" << country << "'" << ", ";
	ss << "'" << bill_addr << "'" << ", ";
	ss << "'" << ship_addr << "'" << ", ";
	ss << "'" << lead_source << "'" << ", ";
	ss << "'" << lead_status << "'" << ", ";
	ss << "'" << lead_rating << "'" << ") ";

	sql = ss.str();
	LOG( "add_lead sql:  ", sql);
	command c(*conn, sql);

	c.emit();
}


int lead_table::get_lead_table_count(){
	string count_sql = "SELECT count(1) FROM lead";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	return count_res->get_int(0);
}

void lead_table::get_lead_table_profile(std::map<string, string> &m)
{

	string sql = "SELECT lead_id, company_name FROM lead";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(0)] = res->get_string(1);
	} while(res->next_row());
}

void lead_table::get_lead_statuss(std::vector<string> &m)
{
	string sql = "SELECT status_name FROM lead_status";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}

void lead_table::get_lead_sources(std::vector<string> &m)
{
	string sql = "SELECT source_name FROM lead_source";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}

void lead_table::get_lead_ratings(std::vector<string> &m)
{
	string sql = "SELECT rating_name FROM lead_rating";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}

void lead_table::get_lead_for_customer(std::map<string, string> &m){
	string sql = "SELECT lead_id, contact_name, company_name FROM lead";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		auto desc = res->get_string(1);
		desc.append(": ").append(res->get_string(2));
		m[res->get_string(0)] = desc;
	} while(res->next_row());

}

void lead_table::get_lead_records( string source, string &result ){

	string sql = "SELECT lead_id, company_name, contact_name, personal_title, first_name, last_name, "
	"phone, email, street_addr, city, state, post_code, country, "
	"bill_addr, ship_addr, lead_source, lead_status, lead_rating"
	" FROM lead ";

		if(!source.empty())
		sql.append("WHERE  ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"lead\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss <<  "\"lead_id\""  << ":" <<  "\"" << res->get_string(0) << "\"" << "," ;
			ss <<  "\"company_name\""  << ":" <<  "\"" << res->get_string(1) << "\"" << "," ;
			ss <<  "\"contact_name\""  << ":" <<  "\"" << res->get_string(2) << "\"" << "," ;
			ss <<  "\"personal_title\""  << ":" <<  "\"" << res->get_string(3) << "\"" << "," ;
			ss <<  "\"first_name\""  << ":" <<  "\"" << res->get_string(4) << "\"" << "," ;
			ss <<  "\"last_name\""  << ":" <<  "\"" << res->get_string(5) << "\"" << "," ;
			ss <<  "\"phone\""  << ":" <<  "\"" << res->get_string(6) << "\"" << "," ;
			ss <<  "\"email\""  << ":" <<  "\"" << res->get_string(7) << "\"" << "," ;
			ss <<  "\"street_addr\""  << ":" <<  "\"" << res->get_string(8) << "\"" << "," ;
			ss <<  "\"city\""  << ":" <<  "\"" << res->get_string(9) << "\"" << "," ;
			ss <<  "\"state\""  << ":" <<  "\"" << res->get_string(10) << "\"" << "," ;
			ss <<  "\"post_code\""  << ":" <<  "\"" << res->get_string(11) << "\"" << "," ;
			ss <<  "\"country\""  << ":" <<  "\"" << res->get_string(12) << "\"" << "," ;
			ss <<  "\"bill_addr\""  << ":" <<  "\"" << res->get_string(13) << "\"" << "," ;
			ss <<  "\"ship_addr\""  << ":" <<  "\"" << res->get_string(14) << "\"" << "," ;
			ss <<  "\"lead_source\""  << ":" <<  "\"" << res->get_string(15) << "\"" << "," ;
			ss <<  "\"lead_status\""  << ":" <<  "\"" << res->get_string(16) << "\"" << "," ;
			ss <<  "\"lead_rating\""  << ":" <<  "\"" << res->get_string(17) << "\"";
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

void lead_table::get_lead_list(std::map<int, string> &leads){
}
void lead_table::get_lead_instance(std::map<string, string> &lead){


	string sql = "SELECT lead_id,  company_name, contact_name, personal_title, first_name, last_name, "
	"phone, email, street_addr, city, state, post_code, country, "
	"bill_addr, ship_addr, lead_source, lead_status, lead_rating "
	" FROM lead  WHERE lead_id = ";

		sql.append("'").append( lead_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		
	
		 lead["lead_id"] = res->get_string(0);
		 lead["company_name"] = res->get_string(1);
		 lead["contact_name"] = res->get_string(2);
		 lead["personal_title"] = res->get_string(3);
		 lead["first_name"] = res->get_string(4);
		 lead["last_name"] = res->get_string(5);
		 lead["phone"] = res->get_string(6);
		 lead["email"] = res->get_string(7);
		 lead["street_addr"] = res->get_string(8);
		 lead["city"] = res->get_string(9);
		 lead["state"] = res->get_string(10);
		 lead["post_code"] = res->get_string(11);
		 lead["country"] = res->get_string(12);
		 lead["bill_addr"] = res->get_string(13);
		 lead["ship_addr"] = res->get_string(14);
		 lead["lead_source"] = res->get_string(15);
		 lead["lead_status"] = res->get_string(16);
		 lead["lead_rating"] = res->get_string(17);
}

void lead_table::update_lead_table(){

	stringstream ss;
	 ss <<  "UPDATE lead SET ";
	ss << "company_name =" << "\"" << company_name <<"\"" << ",";
	ss << "contact_name =" << "\"" << contact_name <<"\"" << ",";
	ss << "personal_title =" << "\"" << personal_title <<"\"" << ",";
	ss << "first_name =" << "\"" << first_name <<"\"" << ",";
	ss << "last_name =" << "\"" << last_name <<"\"" << ",";
	ss << "phone =" << "\"" << phone <<"\"" << ",";
	ss << "email =" << "\"" << email <<"\"" << ",";
	ss << "street_addr =" << "\"" << street_addr <<"\"" << ",";
	ss << "city =" << "\"" << city <<"\"" << ",";
	ss << "state =" << "\"" << state <<"\"" << ",";
	ss << "post_code =" << "\"" << post_code <<"\"" << ",";
	ss << "country =" << "\"" << country <<"\"" << ",";
	ss << "bill_addr =" << "\"" << bill_addr <<"\"" << ",";
	ss << "ship_addr =" << "\"" << ship_addr <<"\"" << ",";
	ss << "lead_source =" << "\"" << lead_source <<"\"" << ",";
	ss << "lead_status =" << "\"" << lead_status <<"\"" << ",";
	ss << "lead_rating =" << "\"" << lead_rating <<"\"" ;
	ss << " WHERE lead_id = " <<  "\"" << 	lead_id <<  "\"" ;


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();

}
