
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

#include "customer_table.h"
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

		string compaign_sql = "SELECT compaign_name, status, start_date, close_date, description FROM compaign WHERE assign_to = ";
		compaign_sql.append(to_string(user_id)).append(" ORDER BY status");
		
		compaign_table ct;
		auto cp_query = ct.BuildQuery(compaign_sql);
		auto res = cp_query->emit_result();

		string count_sql = "SELECT count(*) FROM compaign WHERE assign_to = ";
		count_sql.append(to_string(user_id));

		auto count_query = ct.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/userdashboard.html" );


		stringstream cs;
	
		t.block("meat").repeat(1);

		t.block("meat")[0].set("compaign_num", to_string(rows));

		Block & block = t.block( "meat" )[ 0 ].block( "compaign_block" );

		block.repeat(rows);
		//all fields must be string
 		for ( int i=0; i < rows; i++, res->next_row() ) {
			block.set("compaien_name", res->get_string(0));
			block.set("description", res->get_string(1));
			block.set("status", res->get_string(2));
			block.set("start_date", res->get_string(3));
			block.set("close_date", res->get_string(4));
		}
	
		/*
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
