


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "lead_table.h"
#include "EditLeadInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


EditLeadInterface::EditLeadInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void EditLeadInterface::Process(){
	LOG(rq_->method, rq_->path);

	try {
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		auto id = m["lead_id"];
		lead_table lt;

		std::map<string, string> lead;
		lt.set_lead_id(id);
		lt.get_lead_instance(lead);
/*
                 t.block("meat")[0].set("lead_source_description", lt_get_lead_source_description());
                 t.block("meat")[0].set("lead_status_description", lt_get_lead_status_description());
                 t.block("meat")[0].set("lead_rating_description", lt_get_lead_rating_description());
*/
		LoaderFile loader; 

		Template t( loader );
		t.load("web/editleadinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("lead_id", lead["lead_id"]);
		t.block("meat")[0].set("company_name", lead["company_name"]);
		t.block("meat")[0].set("contact_name", lead["contact_name"]);
		t.block("meat")[0].set("personal_title", lead["personal_title"]);
		t.block("meat")[0].set("first_name", lead["first_name"]);
		t.block("meat")[0].set("last_name", lead["last_name"]);
		t.block("meat")[0].set("phone", lead["phone"]);
		t.block("meat")[0].set("email", lead["email"]);
		t.block("meat")[0].set("street_addr", lead["street_addr"]);
		t.block("meat")[0].set("city", lead["city"]);
		t.block("meat")[0].set("state", lead["state"]);
		t.block("meat")[0].set("post_code", lead["post_code"]);
		t.block("meat")[0].set("country", lead["country"]);
		t.block("meat")[0].set("bill_addr", lead["bill_addr"]);
		t.block("meat")[0].set("ship_addr", lead["ship_addr"]);

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
