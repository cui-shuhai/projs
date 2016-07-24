


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
		string  path = rq_->path;
		utils::parse_get_params(path, m);

		if(m.size() == 0){
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listlead.html" );
			t.render( cs ); 
		}
		else{
			string result;
			lead_table lt;
			//XXX this should be current addigned flag
			lt.get_lead_records( m["from_id"], result); 
			cs << result;
		}
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}