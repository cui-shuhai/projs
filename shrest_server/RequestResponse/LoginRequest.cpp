


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

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		auto sessionId = utils::create_uuid();

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
