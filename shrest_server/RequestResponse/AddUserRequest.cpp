
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

#include "contact_activity.h"
#include "AddUserRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddUserRequest::AddUserRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void AddUserRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		contact_activity c( -1, stoi(m["contact_type"]),stoi( m["contactee"]),stoi( m["contactor"] ), m["create_date"], m["note"]);
		c.add_contact_activity();

		auto id = c.get_contact_activityId();
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addeventresponse.html" );

		t.block("meat").repeat(1);
		t.block("meat")[0].set("event_id", to_string(id));
		t.block("meat")[0].set("contact_type",m["contact_type"]);
		t.block("meat")[0].set("contact_id",  m["contactee"]);
		t.block("meat")[0].set("who_contacts", m["contactor"]);
		t.block("meat")[0].set("when_created", m["create_date"]);
		t.block("meat")[0].set("note", m["note"]);


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
