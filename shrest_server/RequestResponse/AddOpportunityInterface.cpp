


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <string>
#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "opportunity_table.h"
#include "AddOpportunityInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddOpportunityInterface::AddOpportunityInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddOpportunityInterface::ProcessGet(){
	LOG(rq_->method, rq_->path);

	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);
//load adding interface
	if(boost::iequals(m["action"], "add")){
	
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/addopportunityinterface.html" );


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
	if(boost::iequals(m["action"], "edit")){
	try {
		stringstream cs;

		auto id = m["opportunity_id"];
		opportunity_table ot;

		std::map<string, string> opportunity;
		ot.set_opportunity_id(id);
		ot.get_opportunity_instance(opportunity);

		LoaderFile loader; 

		Template t( loader );
		t.load("web/editopportunityinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("opportunity_id", opportunity["opportunity_id"]);
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
	if(boost::iequals(m["action"], "list")){
	try {
		
		stringstream cs;

		string jstr;
		if(m.size() == 1){ //list 
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listopportunity.html" );
			t.render( cs ); 
		}
		else{ //for adding opportunity filling options 
			string result;
			opportunity_table ot;

			string directory = m["directory"];
			std::vector<string> resultset;

			if(directory.compare("opportunity_content") == 0){
				ot.get_opportunity_records("", jstr);
			}

			utils::build_raw_response( jstr);
			rs_ << jstr;
			return;
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
}

void AddOpportunityInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){

	try {
		string amt = m["amount"];
		auto amount = std::stod(amt);
		//opportunity_table c( utils::create_uuid() , m["opportunity_name"], m["assign_to"], m["contact_id"], m["creator_id"], m["close_date"], m["pipeline"], stod(m["amount"]), m["probablity"]);
		opportunity_table c( utils::create_uuid() , m["opportunity_name"], m["assign_to"], m["contact_id"], m["creator_id"], m["close_date"], m["pipeline"], amount, m["probablity"]);

		c.add_opportunity_table();
		stringstream cs;

/*
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addopportunityresponse.html" );

		t.block("meat").repeat(1);
		t.block("meat")[0].set("opportunity_id", c.get_opportunity_id());
		t.block("meat")[0].set("opportunity_name", m["opportunity_name"]);
		t.block("meat")[0].set("due_date", m["due_date"]);
		t.block("meat")[0].set("status", m["status"]);
		t.block("meat")[0].set("description", m["description"]);
		t.block("meat")[0].set("assignee", m["assignee"]);
		t.block("meat")[0].set("assigner", m["assigner"]);
		t.block("meat")[0].set("creator", m["creator"]);
		t.render( cs ); // Render the template with the variables we've set above
	
*/

		cs << "opportunity added" << endl;
 
		
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

		opportunity_table ot( m["opportunity_id"] , m["opportunity_name"], m["assign_to"], m["contact_id"], m["creator_id"], m["close_date"], m["pipeline"], stod(m["amount"]), m["probablity"]);

		ot.update_opportunity_table();

		LoaderFile loader; 

		Template t( loader );

		stringstream cs;

		cs << "opportunity saved" << endl;
		t.render( cs ); 
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}
