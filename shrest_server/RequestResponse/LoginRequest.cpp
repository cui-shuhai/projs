


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
#include "LoginRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;
LoginRequest::LoginRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void LoginRequest::Process(){
	LOG(rq_->method, rq_->path);
	try {

		stringstream cs;

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		//check if existing user
		user_table ut(m["username"]);
		ut.set_pass_word(m["password"]);
		if(!ut.check_login_exist()){
			LOG("login failed");
			LoaderFile loader; // Let's use the default loader that loads files from disk.
			Template t( loader );
			t.load( "web/loginfailure.html" );

			t.render( cs ); // Render the template with the variables we've set above
	 
			
			cs.seekp(0, ios::end);
			rs_ <<  cs.rdbuf();
			rs_.flush();
			return;
		}

		auto sessionId = utils::create_uuid();

		LOG("Add or update to seesion table: ", m["username"]);
		cookie_table ct(sessionId, m["username"], m["password"]);

		ct.add_cookie_table();

		string cookie = "HTTP/1.1 200 OK\r\nSet-Cookie: secret_key=";
		cookie.append(sessionId).append("\r\n\r\n");
		rs_<< cookie;

		CreateDashboard(m["username"], m["password"]);		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
