
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

contact_table::contact_table( string contact_id_, string status_, string first_name_,
		 string last_name_, string contact_from_, string address_, 
		 string primary_phone_, string alt_phone_, string mobile_phone_, 
		 string fax_, string email_, string twitter_, string linkedin_, 
		 string facebook_, string job_title_, string company_id_, 
		 string when_met_, string where_met_, string time_zone_, 
		 string main_contact_, string out_of_marketing_, string out_of_billing_, 
                 string extra_info_):
	SqlAccessor(),
	contact_id { contact_id_ },
	status { status_ },
	first_name { first_name_ },
	last_name { last_name_ },
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

	stringstream ss;
	string sql = "INSERT INTO 'contact'(contact_id,  "
		"status, first_name, last_name, contact_from, "
		"address, primary_phone, alt_phone, mobile_phone, fax, email, "
		"twitter, linkedin, facebook, job_title, company_id, "
		"when_met, where_met, time_zone, main_contact, "
		"out_of_marketing, out_of_billing, extra_info )  VALUES(  ";

	ss << sql;
	ss << "'" <<  contact_id << "'" << ",";
	ss << "'" <<  status << "'" << ",";
	ss << "'" <<  first_name << "'" << ",";
	ss << "'" <<  last_name << "'" << ",";
	ss << "'" <<  contact_from << "'" << ",";
	ss << "'" <<  address << "'" << ",";
	ss << "'" <<  primary_phone << "'" << ",";
	ss << "'" <<  alt_phone << "'" << ",";
	ss << "'" <<  mobile_phone << "'" << ",";
	ss << "'" <<  fax << "'" << ",";
	ss << "'" <<  email << "'" << ",";
	ss << "'" <<  twitter << "'" << ",";
	ss << "'" <<  linkedin << "'" << ",";
	ss << "'" <<  facebook << "'" << ",";
	ss << "'" <<  job_title << "'" << ",";
	ss << "'" <<  company_id << "'" << ",";
	ss << "'" <<  when_met << "'" << ",";
	ss << "'" <<  where_met << "'" << ",";
	ss << "'" <<  time_zone << "'" << ",";
	ss << "'" <<  main_contact << "'" << ",";
	ss << "'" <<  out_of_marketing << "'" << ",";
	ss << "'" <<  out_of_billing << "'" << ",";
	ss << "'" <<  extra_info << "'" << ")";

	sql = ss.str();
	command c(*conn, sql);

	LOG("add contact: " , sql );
	c.emit();
}

void contact_table::get_contact_records( string source, string &result ){
		string sql = "SELECT "
		"status AS contact_satus, first_name, last_name, contact_from AS contact_source , "
		"address, primary_phone, alt_phone, mobile_phone, fax, email, "
		"twitter, linkedin, facebook, job_title, company_id, "
		"when_met, where_met, time_zone, main_contact, "
		"out_of_marketing, out_of_billing, extra_info , contact_id "
		"FROM contact ";

		if(!source.empty()){
			sql.append("WHERE contact_from = ");
			sql.append("'").append(source).append("'");
		}

			query q(*conn, sql);
			LOG("sql", sql);
			auto res = q.emit_result();
		
			stringstream ss;

			bool first = true;
			ss << "{ \"contact\":[ ";
			do{
				if(first)
					first = false;
				else{
					ss << ", ";
				}
				ss << "{";
				ss << "\"contact_status\"" << ":" << "\"" << res->get_string(0) << "\"" << "," ;
				ss << "\"first_name\"" << ":" << "\"" << res->get_string(1) << "\"" << "," ;
				ss << "\"last_name\"" << ":" << "\"" << res->get_string(2) << "\"" << "," ;
				ss << "\"contact_source \"" << ":" << "\"" << res->get_string(3) << "\"" << "," ;
				ss << "\"address\"" << ":" << "\"" << res->get_string(4) << "\"" << "," ;
				ss << "\"primary_phone\"" << ":" << "\"" << res->get_string(5) << "\"" << "," ;
				ss << "\"alt_phone\"" << ":" << "\"" << res->get_string(6) << "\"" << "," ;
				ss << "\"mobile_phone\"" << ":" << "\"" << res->get_string(7) << "\"" << "," ;
				ss << "\"fax\"" << ":" << "\"" << res->get_string(8) << "\"" << "," ;
				ss << "\"email\"" << ":" << "\"" << res->get_string(9) << "\"" << "," ;
				ss << "\"twitter\"" << ":" << "\"" << res->get_string(10) << "\"" << "," ;
				ss << "\"linkedin\"" << ":" << "\"" << res->get_string(11) << "\"" << "," ;
				ss << "\"facebook\"" << ":" << "\"" << res->get_string(12) << "\"" << "," ;
				ss << "\"job_title\"" << ":" << "\"" << res->get_string(13) << "\"" << "," ;
				ss << "\"company_id\"" << ":" << "\"" << res->get_string(14) << "\"" << "," ;
			ss << "\"when_met\"" << ":" << "\"" << res->get_string(15) << "\"" << "," ;
			ss << "\"where_met\"" << ":" << "\"" << res->get_string(16) << "\"" << "," ;
			ss << "\"time_zone\"" << ":" << "\"" << res->get_string(17) << "\"" << "," ;
			ss << "\"main_contact\"" << ":" << "\"" << res->get_string(18) << "\"" << "," ;
			ss << "\"out_of_marketing\"" << ":" << "\"" << res->get_string(19) << "\"" << "," ;
			ss << "\"out_of_billing\"" << ":" << "\"" << res->get_string(20) << "\"" << "," ;
			ss << "\"extra_info\"" << ":" << "\"" << res->get_string(21) << "\"" << "," ;
			ss << "\"contact_id\"" << ":" << "\"" << res->get_string(22) << "\"" ;  
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}

void contact_table::get_contact_list(std::map<string, string> &contacts){
	auto count_sql = "SELECT count(1) FROM contact";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	auto rows = count_res->get_int(0);

	if(rows == 0)
		return;

	string sql = "SELECT contact_id, first_name, last_name, contact_from.description "
		"FROM contact INNER JOIN contact_from ON contact.contact_from = contact_from.contact_from";
	
	query q(*conn, sql);

	LOG("sql", sql);
	auto res = q.emit_result();

	do{
		string contact_item = res->get_string(1) + " " + res->get_string(2) +": " + res->get_string(3);
		contacts[res->get_string(0)] = contact_item;
	} while(res->next_row());
}

void contact_table::get_contact_instance(std::map<string, string> &contact){
		string sql = "SELECT "
"  status, first_name, last_name, contact_from, address, primary_phone, alt_phone, mobile_phone, fax, email, twitter, linkedin, facebook, job_title, company_id, when_met, where_met, time_zone, main_contact, out_of_marketing, out_of_billing, extra_info "
		"FROM contact  WHERE  contact_id = ";


		sql.append("'").append(contact_id).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		
		contact["contact_id"] = contact_id;
		contact["status"] = res->get_string(0);
		contact["first_name"] = res->get_string(1);
		contact["last_name"] = res->get_string(2);
		contact["contact_from"] = res->get_string(3);
		contact["address"] = res->get_string(4);
		contact["primary_phone"] = res->get_string(5);
		contact["alt_phone"] = res->get_string(6);
		contact["mobile_phone"] = res->get_string(7);
		contact["fax"] = res->get_string(8);
		contact["email"] = res->get_string(9);
		contact["twitter"] = res->get_string(10);
		contact["linkedin"] = res->get_string(11);
		contact["facebook"] = res->get_string(12);
		contact["job_title"] = res->get_string(13);
		contact["company_id"] = res->get_string(14);
		contact["when_met"] = res->get_string(15);
		contact["where_met"] = res->get_string(16);
		contact["time_zone"] = res->get_string(17);
		contact["main_contact"] = res->get_string(18);
		contact["out_of_marketing"] = res->get_string(19);
		contact["out_of_billing"] = res->get_string(20);
		contact["extra_info"] = res->get_string(21);
}

void contact_table::get_contact_statuss(std::vector<string> &m)
{
	string sql = "SELECT status FROM contact_status";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
void contact_table::get_contact_froms(std::vector<string> &m)
{
	string sql = "SELECT contact_from FROM contact_from";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
