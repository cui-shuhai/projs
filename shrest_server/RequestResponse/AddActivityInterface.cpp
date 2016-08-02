

#define BOOST_SPIRIT_THREADSAFE
#include <boost/algorithm/string.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "activity_table.h"
#include "activity_status.h"
#include "activity_type.h"
#include "activity_priority.h"
#include "user_table.h"
#include "AddActivityInterface.h"

#include "shrest_log.h"
using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddActivityInterface::AddActivityInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/
void AddActivityInterface::ProcessGet(){
	LOG(rq_->method, rq_->path);

	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);
//load adding interface
	if(boost::iequals(m["action"], "add")){
		try {		
			stringstream cs;
					
			LoaderFile loader;
			Template t( loader );
			t.load( "web/addactivityinterface.html" );

			t.block("meat").repeat(1); 
			{
			       activity_type at;
			       Block & block = t.block( "meat" )[ 0 ].block( "typeblock" );
			       std::vector<string> types;

			       at.get_activity_type(types);
			       auto rows = types.size();
			       block.repeat(rows);
			       int i = 0;
			       for(const auto &v : types){
				       block[i].set("activity_type_value", v);
				       block[i].set("activity_type_show", v);
					++i;
			       }
			}
			{
			       activity_status at;
			       Block & block = t.block( "meat" )[ 0 ].block( "statusblock" );
			       std::vector<string> statuss;

			       at.get_activity_status(statuss);
			       auto rows = statuss.size();
			       block.repeat(rows);
			       int i = 0;
			       for(const auto &v : statuss){
				       block[i].set("activity_status_value", v);
				       block[i].set("activity_status_show", v);
					++i;
			       }
			}
			{
			       activity_priority at;
			       Block & block = t.block( "meat" )[ 0 ].block( "priorityblock" );
			       std::vector<string> prioritys;

			       at.get_activity_priority(prioritys);
			       auto rows = prioritys.size();
			       block.repeat(rows);
			       int i = 0;
			       for(const auto &v : prioritys){
				       block[i].set("activity_priority_value", v);
				       block[i].set("activity_priority_show", v);
					++i;
			       }
			}
			{
				//this comes from users(operational employee)
			       user_table ut;
			       Block & block = t.block( "meat" )[ 0 ].block( "presiderblock" );
			       std::map<string, string> presiders;

			       ut.get_user_list(presiders);
			       auto rows = presiders.size();
			       block.repeat(rows);
			       int i = 0;
			       for(const auto &v : presiders){
				       block[i].set("activity_presider_value", v.first);
				       block[i].set("activity_presider_show", v.second);
					++i;
			       }
			}


			t.render( cs ); // Render the template with the variables we've set above
	 
			
			cs.seekp(0, ios::end);
			rs_ <<  cs.rdbuf();
			rs_.flush();
			
		}
		catch(exception& e) {
			rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
		}
		return;
	}
	if(boost::iequals(m["action"], "list")){

		try {
			stringstream cs;

			string jstr;
			if(m.size() <= 1){ //list lead
				LoaderFile loader; 
				Template t( loader );
				t.load( "web/listactivity.html" );
				t.render( cs ); 
			}
			else{ //for adding lead
				string result;
				activity_table ct;

				string directory = m["directory"];
				std::map<int, string> resultset;

				if(boost::iequals(directory, "activity_content")){
					ct.get_activity_records("", jstr);
				}
				utils::build_raw_response( jstr);
				rs_ << jstr;
				return;
			}
			
			cs.seekp(0, ios::end);
			rs_ <<  cs.rdbuf();
			rs_.flush();
			
		}
		catch(exception& e) {
			rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
		}
		return;
	}
	if(boost::iequals(m["action"], "edit")){

	try {
		stringstream cs;

		string result;
		activity_table at;

		std::map<int, string> resultset;

		string jstr;
		if(m.size() == 2){
		//if(boost::iequals(m["directory"], "edit")){

			auto id = m["activity_id"];

			std::map<string, string> activity;
			at.set_activity_id(id);
			at.get_activity_instance(activity);


			LoaderFile loader; 
			Template t( loader );
			t.load("web/editactivityinterface.html");
			t.block("meat").repeat(1);

			t.block("meat")[0].set("activity_id", activity["activity_id"]); 
			t.block("meat")[0].set("activity_name", activity["activity_name"]);
			t.block("meat")[0].set("activity_type_value", "0");
			t.block("meat")[0].set("activity_type_show", activity["activity_type"]);
			t.block("meat")[0].set("activity_status_value", "0");
			t.block("meat")[0].set("activity_status_show", activity["activity_status"]);
			t.block("meat")[0].set("activity_priority_value", "0");
			t.block("meat")[0].set("activity_priority_show", activity["activity_priority"]);
			t.block("meat")[0].set("who_preside_value", "0");
			t.block("meat")[0].set("who_preside_show", activity["who_preside"]);
			t.block("meat")[0].set("when_created", activity["when_created"]);
			t.block("meat")[0].set("note", activity["note"]);

			t.render( cs ); 
		}
		else {
//			if(directory.compare("edit_activity") == 0){
			//edit interface javascript pull data
	//like listLeadrequest, query enum values
//			at.get_activity_types
//			at.get_activity_status
//			at.get_activity_priority
//			at.get_activity_preside

//			}
			utils::build_raw_response( jstr);
			rs_ << jstr;
			return;
		}
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
		}
		catch(exception& e) {
			rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
		}
	
	}
	
}
void AddActivityInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){
	try {

		activity_table c( utils::create_uuid() , m["activity_name"], 
			 m["activity_type"] ,  m["activity_status"] ,  m["activity_priority"] , 
			 m["who_preside"] , utils::get_date(), m["note"]);

		c.add_activity_table();

		auto id = c.get_activity_id();
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addactivityrequest.html" );
/*
		t.block("meat").repeat(1);
		t.block("meat")[0].set("event_id", to_string(id));
		t.block("meat")[0].set("contact_type",m["contact_type"]);
		t.block("meat")[0].set("contact_id",  m["contactee"]);
		t.block("meat")[0].set("who_contacts", m["contactor"]);
		t.block("meat")[0].set("when_created", m["create_date"]);
		t.block("meat")[0].set("note", m["note"]);
*/


		stringstream cs;
		t.render( cs ); // Render the template with the variables we've set above
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
	if(boost::iequals(m["submit"], "save")){
	try {

		activity_table c( m["activity_id"], m["activity_name"], 
  m["activity_type"] ,  m["activity_status"] ,  m["activity_priority"] ,  m["who_preside"] , utils::get_date(), m["note"]);

		c.update_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "activity saved" << endl;
		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}
