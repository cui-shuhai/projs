
#include <string>
#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed in 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customers_table.h"
#include "user_table.h"
#include "cookie_table.h"
#include "compaign_table.h"
#include "RequestResponse.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;



RequestResponse::RequestResponse(HttpServer::Response &rs, ShRequest rq):
		rs_(rs), rq_(rq){}

RequestResponse::~RequestResponse(){}

bool RequestResponse::GetSession(std::string& session){
	auto cookies = rq_->cookies;
		
	if(!cookies.empty()){

		boost::regex re("Cookie:\\s* secret_key=([^&; ]+)\\r", boost::regex::icase); 
		boost::smatch what; 
		if (regex_match(cookies, what, re)){
			session = what[1].str();
			return true;
		}   	
	}
	return false;
}

void RequestResponse::CreateDashboard(const string & username, const string password){

LOG(rq_->method, rq_->path);

	try {
		
		//check list of tables to show progress, what to do
		//compaigns, opportunities, activities, 
		string key;
		GetSession(key);

		cookie_table ckt(key);
		auto user_id = ckt.get_user_id();

		string compaign_sql = "SELECT compaingn_name, status, start_date, close_date, description FRROM compaign WHERE assign_to = ";
		compaign_sql.append(to_string(user_id)).append(" ORDER BY sttus");
		
		compaign_table ct;
		auto cp_query = ct.BuildQuery(compaign_sql);
		auto cp_result = cp_query->emit_result();

		auto rows = cp_result->get_row_count();

		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/userdashboard.html" );


		stringstream cs;
		
		/*
		t.block("meat").repeat(rows);

		//all fields must be string
 		for ( int i=0; i < rows; i++, res->next_row() ) {
			t.block("meat")[i].set("customerId", to_string(res->get_int(0)));
			t.block("meat")[i].set("firstname", res->get_string(1));
			t.block("meat")[i].set("lastname", res->get_string(2));
			t.block("meat")[i].set("age", to_string(res->get_int(3)));
			t.block("meat")[i].set("phone", res->get_string(4));
			t.block("meat")[i].set("address", res->get_string(5));
			t.block("meat")[i].set("activities", to_string(res->get_int(0)));
			t.block("meat")[i].set("transactions", to_string(res->get_int(0)));

		}

*/
		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}


}
