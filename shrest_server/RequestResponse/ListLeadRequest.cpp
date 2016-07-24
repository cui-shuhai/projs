


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
#include "cookie_table.h"
#include "ListLeadRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListLeadRequest::ListLeadRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListLeadRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		
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
			string result;
			lead_table lt;

			std::map<int, string> resultset;
			if(m["directory"] == "lead_source"){
				lt.get_lead_source( resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(m["directory"] == "lead_status"){
				lt.get_lead_status( resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(m["directory"] == "lead_rating"){
				lt.get_lead_rating(resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(m["directory"] == "all_leads"){
				lt.get_lead_records("", jstr);
			}
			else if(m["directory"] == "add_customer"){
				lt.get_lead_for_customer(resultset);
				utils::build_json(resultset, jstr); 
			}

		//	cs << jstr;
		}
		
		//cs.seekp(0, ios::end);
		//rs_ << "HTTP/1.1 200 OK\r\nContent-Length: " << jstr.length() << "\r\n\r\n" << jstr;
		//rs_ <<  cs.rdbuf();
		rs_ << "HTTP/1.1 200 OK\r\n" << "Content-Type: application/javascript"  << "\r\n" << "Content-Length: " << jstr.length() << "\r\n\r\n" << jstr;
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
