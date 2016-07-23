
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
#include "AddCustomerContactInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddCustomerContactInterface::AddCustomerContactInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void AddCustomerContactInterface::Process(){
	LOG(rq_->method, rq_->path);

	try {

		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );

		t.load( "web/addcontactinterface.html" );

		t.block("meat").repeat(1);

		t.block("meat")[0].set("newcontactaction", "addcustomercontactrequest");
		t.block("meat")[0].set("contact_source", "to add contact");

		Block &block =t.block("meat")[0].block("from_block");

		Customer ct;
		std::map<int, string> m;
		ct.GetCustomerProfile(m); 
		
		auto rows = m.size();

		block.repeat(rows);

		int i = 0;
		for(const auto & v : m){
			block[i].set("from_value", to_string(v.first));
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



