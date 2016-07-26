


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "contact_table.h"
#include "ListContactRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListContactRequest::ListContactRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListContactRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
	//parse path, contact? load : send pack query information	
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string jstr;
		if(m.size() == 0){
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listcontact.html" );
			t.render( cs );
		}
		else{
			string result;
			contact_table ct;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("contact_content") == 0){
				ct.get_contact_records( "", jstr); 
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
