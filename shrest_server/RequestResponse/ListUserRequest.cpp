


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "user_table.h"
#include "ListUserRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListUserRequest::ListUserRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListUserRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string jstr;
		if(m.size() == 0){ //list user
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listuser.html" );
			t.render( cs ); 
		}
		else{ //for adding user
			string result;
			user_table ut;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("user_content") == 0){
				ut.get_user_records("", jstr);
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
