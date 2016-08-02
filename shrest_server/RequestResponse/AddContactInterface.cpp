
#include <string>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "contact_table.h"
#include "AddContactInterface.h"

#include "shrest_log.h"
using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddContactInterface::AddContactInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}


void AddContactInterface::ProcessGet(){
	LOG(rq_->method, rq_->path);

	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);

	if(boost::iequals(m["action"], "add")){
	try {		
		stringstream cs;
		LoaderFile loader; 
		Template t( loader );
		t.load( "web/addcontactinterface.html" );

		t.block("meat").repeat(1); 

		t.block("meat")[0].set("company", m["company"]);
		t.block("meat")[0].set("category", m["category"]);
		t.block("meat")[0].set("source_id", m["source_id"]);
		t.render( cs ); 
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
	if(boost::iequals(m["action"], "edit")){
		stringstream cs;

		string result;
		contact_table at;

		std::map<int, string> resultset;

		string jstr;
		if(m.size() <= 1){
			auto id = m["contact_id"];

			std::map<string, string> contact;
			at.set_contact_id(id);
			//at.get_contact_instance(contact);

			LoaderFile loader; 
			Template t( loader );
			t.load("web/editcontactinterface.html");
			t.block("meat").repeat(1);

			//t.block("meat")[0].set("activity_id", activity["activity_id"]); 

			t.render( cs ); 
			cs.seekp(0, ios::end);
			rs_ <<  cs.rdbuf();
			rs_.flush();

		}
	}
	if(boost::iequals(m["action"], "list")){
	try {
	//parse path, contact? load : send pack query information	
		stringstream cs;

		string jstr;
		if(m.size() == 1){
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listcontact.html" );
			t.render( cs );
		}
		else{
			string result;
			contact_table ct;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("contact_content") == 0){
				ct.get_contact_records( "", jstr); 
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
	}
}

void AddContactInterface::ProcessPost(){
}
