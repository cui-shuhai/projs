


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
#include "lead_table.h"
#include "ListCustomerRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListCustomerRequest::ListCustomerRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListCustomerRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		std::map<string, string> m;
		stringstream cs;
		string jstr;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		if(m.size() == 0){ //list lead
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listcustomers.html" );
			t.render( cs ); 
		}
		else{ //for adding lead
			string result;

			string directory = m["directory"];

			if( directory.compare("add_contact") == 0){
			}
			else if( directory.compare("customer_content") == 0){
				customer_table ct;
				ct.get_customer_records("", jstr);
			}
			else if( directory.compare("last_name") == 0){
				customer_table ct;
				ct.get_last_names("", jstr);
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
