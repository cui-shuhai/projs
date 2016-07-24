


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
#include "ListCustomersGet.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListCustomersGet::ListCustomersGet(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListCustomersGet::Process(){
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
			lead_table lt;

			std::map<int, string> resultset;
			if(m["directory"] == "add_contact"){
			//	lt.get_lead_source( resultset); 
			//	utils::build_json(resultset, jstr); 
			}
			else if(m["directory"] == "all_customers"){
				lt.get_lead_records("", jstr);
			}

			cs << jstr;
		}
		
		rs_ << "HTTP/1.1 200 OK\r\n" << "Content-Type: application/javascript"  << "\r\n" << "Content-Length: " << jstr.length() << "\r\n\r\n" << jstr;
		//rs_ << "HTTP/1.1 200 OK\r\n" << "Content-Type: text/plain"  << "\r\n" << "Content-Length: " << jstr.length() << "\r\n\r\n" << jstr;
		//cs.seekp(0, ios::end);
		//rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
