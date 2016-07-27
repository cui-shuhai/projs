
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

#include "lead_table.h"
#include "contact_table.h"
#include "AddLeadContactInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddLeadContactInterface::AddLeadContactInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void AddLeadContactInterface::Process(){
	LOG(rq_->method, rq_->path);

	try {
/*
//parse for adding contact for either lead or customer
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string jstr;
		if(m.size() == 0){ //list lead
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listlead.html" );
			t.render( cs ); 
		}
		else{ //for adding lead

*/
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );

		t.load( "web/addcontactinterface.html" );

		t.block("meat").repeat(1);
		t.block("meat")[0].set("Information_id", "New lead contact:");

		t.block("meat")[0].set("newcontactaction", "addleadcontactrequest");
		t.block("meat")[0].set("contact_source", "to add contact");

		Block &block =t.block("meat")[0].block("from_block");

		lead_table lt;
		std::map<string, string> m;
		lt.get_lead_table_profile(m); 
		
		auto rows = m.size();

		block.repeat(rows);

		int i = 0;
		for(const auto & v : m){
			block[i].set("from_value", v.first);
			block[i].set("from_show", v.second);
		}

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



