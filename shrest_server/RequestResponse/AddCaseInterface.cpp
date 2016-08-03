


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "case_table.h"
#include "cookie_table.h"
#include "AddCaseInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

AddCaseInterface::AddCaseInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddCaseInterface::ProcessGet(){

	LOG(rq_->method, rq_->path);
	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);

	if(boost::iequals(m["action"], "add")){
	     try {

			if(m.size() == 1)
			{
				stringstream content_stream;
				LoaderFile loader; 

				Template t( loader );

				t.load( "web/addcaseinterface.html" );

				t.render( content_stream ); 
				
				content_stream.seekp(0, ios::end);
				rs_ <<  content_stream.rdbuf();
				rs_.flush();
			}
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
		if(m.size() == 1){ //list 
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listcase.html" );
			t.render( cs ); 
		}
		else{ //for adding 
		
			string result;
			case_table ct;
			string directory = m["directory"];

			if(directory.compare("case_content") == 0){
				ct.get_case_records("", jstr);
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

		auto id = m["case_id"];
		case_table ct;

		std::map<string, string> case_tbl;
		ct.set_case_id(id);
		ct.get_case_instance(case_tbl);

		LoaderFile loader; 

		Template t( loader );
		t.load("web/editcaseinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("case_id", case_tbl["case_id"]);
		t.block("meat")[0].set("assign_to", case_tbl["assign_to"]);
		t.block("meat")[0].set("contact", case_tbl["contact"]);
		t.block("meat")[0].set("subject", case_tbl["subject"]);
		t.block("meat")[0].set("priority", case_tbl["priority"]);
		t.block("meat")[0].set("status", case_tbl["status"]);
		t.block("meat")[0].set("type", case_tbl["type"]);
		t.block("meat")[0].set("reason", case_tbl["reason"]);
		t.block("meat")[0].set("last_activity", case_tbl["last_activity"]);
		t.block("meat")[0].set("next_activity", case_tbl["next_activity"]);

		t.render( cs ); 
		
		cs.seekp(0, ios::end);
		string page = cs.str();
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	
	}
}

void AddCaseInterface::ProcessPost() 
{
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){
	try {

		string id = utils::create_uuid();
		case_table c( id, m["assign_to"], m["contact"], m["subject"], m["priority"], m["status"], m["type"], m["reason"], m["last_activity"], m["next_activity"]);

		c.add_case_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "new case added" << endl;
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
	if(boost::iequals(m["submit"], "save")){
	try {

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);
		case_table c( m["case_id"], m["assign_to"], m["contact"], m["subject"], m["priority"], m["status"], m["type"], m["reason"], m["last_activity"], m["next_activity"]);

		c.update_case_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "case saved" << endl;
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

