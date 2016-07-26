


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "EditCustomerInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


EditCustomerInterface::EditCustomerInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void EditCustomerInterface::Process(){
	LOG(rq_->method, rq_->path);

	try {
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		auto id = m["customer_id"];
		customer_table ct;

		std::map<string, string> customer;
		ct.set_customer_id(id);
		ct.get_customer_instance(customer);

		LoaderFile loader; 

		Template t( loader );
		t.load("web/editcustomerinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("customer_id", customer["customer_id"]);
		t.block("meat")[0].set("company_name", customer["company_name"]);
		t.block("meat")[0].set("contact_name", customer["contact_name"]);
		t.block("meat")[0].set("personal_title", customer["personal_title"]);
		t.block("meat")[0].set("first_name", customer["first_name"]);
		t.block("meat")[0].set("last_name", customer["last_name"]);
		t.block("meat")[0].set("phone", customer["phone"]);
		t.block("meat")[0].set("email", customer["email"]);
		t.block("meat")[0].set("street_addr", customer["street_addr"]);
		t.block("meat")[0].set("city", customer["city"]);
		t.block("meat")[0].set("state", customer["state"]);
		t.block("meat")[0].set("post_code", customer["post_code"]);
		t.block("meat")[0].set("country", customer["country"]);
		t.block("meat")[0].set("bill_addr", customer["bill_addr"]);
		t.block("meat")[0].set("ship_addr", customer["ship_addr"]);

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
