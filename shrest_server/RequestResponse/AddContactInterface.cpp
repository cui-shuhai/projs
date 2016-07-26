
#include <string>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "contact_table.h"
#include "AddContactInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddContactInterface::AddContactInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void AddContactInterface::Process(){
	LOG(rq_->method, rq_->path);

	try {

//parse for adding contact for either lead or customer
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string jstr;
		LoaderFile loader; 
		Template t( loader );

		if(m.size() == 0){ //list lead

			t.load( "web/addcontactinterface.html" );
		}
		else{ //for adding lead

			string directory = m["directory"];

			if(directory.compare("edit_lead") == 0){
				t.load( "web/addcontactinterface.html" );
				t.block("meat").repeat(1);
				t.block("meat")[0].set("company", m["company"]);
				t.block("meat")[0].set("category", "lead");
				t.block("meat")[0].set("source_id", m["lead_id"]);
			}
			else if(directory.compare("edit_customer") == 0){
				t.load( "web/addcontactinterface.html" );
				t.block("meat").repeat(1);
				t.block("meat")[0].set("company", m["company"]);
				t.block("meat")[0].set("category", "customer");
				t.block("meat")[0].set("source_id", m["customer_id"]);
			}
		}
		t.render( cs ); 
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}



