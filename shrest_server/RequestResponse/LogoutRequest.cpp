


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "cookie_table.h"
#include "user_table.h"
#include "LogoutRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;
LogoutRequest::LogoutRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void LogoutRequest::Process(){
	LOG(rq_->method, rq_->path);
	try {

		string sessionId;
		
		GetSession(sessionId);

		cookie_table ct(sessionId);

		ct.delete_cookie_table();

		string cookie = "HTTP/1.1 200 OK\r\nSet-Cookie: secret_key=";
		rs_<< cookie;

		stringstream content_stream;
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/index.html" );        

		t.render( content_stream ); // Render the template with the variables we've set above
 
		//find length of content_stream (length received using content_stream.tellp())
		content_stream.seekp(0, ios::end);

		rs_ <<  content_stream.rdbuf();
		rs_.flush();

	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
