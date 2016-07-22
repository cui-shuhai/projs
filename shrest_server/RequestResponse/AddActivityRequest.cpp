
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

#include "activity_table.h"
#include "AddActivityRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddActivityRequest::AddActivityRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  
void AddActivityRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		activity_table c( -1, m["activity_name"], 
			stoi( m["activity_type"] ), stoi( m["activity_status"] ), stoi( m["activity_priority"] ), 
			stoi( m["who_preside"] ), utils::get_date(), m["note"]);

		c.add_activity_table();

		auto id = c.get_activity_tableId();
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addactivityrequest.html" );
/*
		t.block("meat").repeat(1);
		t.block("meat")[0].set("event_id", to_string(id));
		t.block("meat")[0].set("contact_type",m["contact_type"]);
		t.block("meat")[0].set("contact_id",  m["contactee"]);
		t.block("meat")[0].set("who_contacts", m["contactor"]);
		t.block("meat")[0].set("when_created", m["create_date"]);
		t.block("meat")[0].set("note", m["note"]);
*/


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
