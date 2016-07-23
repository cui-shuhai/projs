
#include <string>

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

#include "user_table.h"
#include "AddLeadContactRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddLeadContactRequest::AddLeadContactRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void AddLeadContactRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);


		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		user_table u(m["login_name"], m["pass_word"],stoi( m["new_user"] ), stoi(m["role_id"]), stoi(m["profile_id"]), utils::get_date(), GetUserId());

		if(!u.check_user_exist())
		{
			u.add_user_table();

			t.load( "web/adduserresponse.html" );
		}
		else
		{
			t.load( "web/adduserexistwarning.html" );
		}

		t.block("meat").repeat(1);
		t.block("meat")[0].set("login_name",m["login_name"]);


		stringstream cs;
		t.render( cs ); // Render the template with the variables we've set above
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
