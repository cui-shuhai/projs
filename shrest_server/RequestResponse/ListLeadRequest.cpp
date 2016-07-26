


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

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("lead_source") == 0){
				lt.get_lead_source( resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(directory.compare("lead_status") == 0){
				lt.get_lead_status( resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(directory.compare("lead_rating") == 0){
				lt.get_lead_rating(resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(directory.compare("lead_content") == 0){
				lt.get_lead_records("", jstr);
			}
			else if(directory.compare("add_customer") == 0){
				lt.get_lead_for_customer(resultset);
				utils::build_json(resultset, jstr); 
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
