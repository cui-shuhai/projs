
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>
#include <sstream>

#define BOOST_SPIRIT_THREADSAFE
//#include <boost/property_tree/ptree.hpp>
//#include <boost/property_tree/json_parser.hpp>

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_db/contact_table.h"
#include "shrest_log.h"

contact_table::contact_table():SqlAccessor()
{
}

contact_table::contact_table( int contact_id_, int status_, string firstName_,
		 string lastName_, int contact_from_, string address_, 
		 string primary_phone_, string alt_phone_, string mobile_phone_, 
		 string fax_, string email_, string twitter_, string linkedin_, 
		 string facebook_, string job_title_, int company_id_, 
		 string when_met_, string where_met_, string time_zone_, 
		 int main_contact_, int out_of_marketing_, int out_of_billing_, 
                 string extra_info_):
	SqlAccessor(),
	contact_id { contact_id_ },
	status { status_ },
	firstName { firstName_ },
	lastName { lastName_ },
	contact_from { contact_from_ },
	address { address_ },
	primary_phone { primary_phone_ },
	alt_phone { alt_phone_ },
	mobile_phone { mobile_phone_ },
	fax { fax_ },
	email { email_ },
	twitter { twitter_ },
	linkedin { linkedin_ },
	facebook { facebook_ },
	job_title { job_title_ },
	company_id { company_id_ },
	when_met { when_met_ },
	where_met { where_met_ },
	time_zone { time_zone_ },
	main_contact { main_contact_ },
	out_of_marketing { out_of_marketing_ },
	out_of_billing { out_of_billing_ },
	extra_info { extra_info_ }
{
}

contact_table::~contact_table(){
}

void contact_table::add_contact_table(){

	auto sql = "INSERT INTO 'contact'("
		"status, firstName, lastName, contact_from, "
		"address, primary_phone, alt_phone, mobile_phone, fax, email, "
		"twitter, linkedin, facebook, job_title, company_id, "
		"when_met, where_met, time_zone, main_contact, "
		"out_of_marketing, out_of_billing, extra_info )  VALUES( "
		"?, ?, ?, ?, ?, ?, ?, ?, "
		"?, ?, ?, ?, ?, ?, ?, ?, "
		"?, ?, ?, ?, ?, ? )";

	command c(*conn, sql);
	c.bind(1, status);
	c.bind(2, firstName);
	c.bind(3, lastName);
	c.bind(4, contact_from);
	c.bind(5, address);
	c.bind(6, primary_phone);
	c.bind(7, alt_phone);
	c.bind(8, mobile_phone);
	c.bind(9, fax);
	c.bind(10, email);
	c.bind(11, twitter);
	c.bind(12, linkedin);
	c.bind(13, facebook);
	c.bind(14, job_title);
	c.bind(15, company_id);
	c.bind(16, when_met);
	c.bind(17, where_met);
	c.bind(18, time_zone);
	c.bind(19, main_contact);
	c.bind(20, out_of_marketing);
	c.bind(21, out_of_billing);
	c.bind(22, extra_info);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	contact_id = id_res->get_int(0);

}

int contact_table::get_contact_tableId(){
	return contact_id;
}

void contact_table::get_contact_records( string source, string &result ){
	string sql = "SELECT contact_id, firstName, lastName, contact_from.description "
		"FROM contact INNER JOIN contact_from ON contact.contact_from = contact_from.contact_from" 
		"  WHERE lower(contact_from.description) = " ;

		sql.append("'").append(source).append("'");

		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ contact:[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{";
			ss  << "contact_id:" << res->get_int(0) ;
			ss <<   ", " <<  "firstName:" << res->get_string(1) ;
			ss << ", " << "lastName:" << res->get_string(2);
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

void contact_table::get_contact_list(std::map<int, string> &contacts){
	auto count_sql = "SELECT count(1) FROM contact";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	auto rows = count_res->get_int(0);

	if(rows == 0)
		return;

	string sql = "SELECT contact_id, firstName, lastName, contact_from.description "
		"FROM contact INNER JOIN contact_from ON contact.contact_from = contact_from.contact_from";
	
	query q(*conn, sql);

	LOG("sql", sql);
	auto res = q.emit_result();

	do{
		string contact_item = res->get_string(1) + " " + res->get_string(2) +": " + res->get_string(3);
		contacts[res->get_int(0)] = contact_item;
	} while(res->next_row());
}

