


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "activity_table.h"
#include "EditActivityInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


EditActivityInterface::EditActivityInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void EditActivityInterface::Process(){
	LOG(rq_->method, rq_->path);

	try {
		stringstream cs;
		std::map<string, string> m;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string result;
		activity_table at;

		string directory = m["directory"];
		std::map<int, string> resultset;

		string jstr;
		if(m.size() == 0){ 
			cs << "Wrong parameter\n";
			LOG("Error");
		}
		if(directory.compare("activity") == 0){

			auto id = stoi(m["activity_id"]);

			std::map<string, string> activity;
			at.set_activity_id(id);
			at.get_activity_instance(activity);


			LoaderFile loader; 
			Template t( loader );
			t.load("web/editactivityinterface.html");
			t.block("meat").repeat(1);

			t.block("meat")[0].set("activity_id", activity["activity_id"]); 
			t.block("meat")[0].set("activity_name", activity["activity_name"]);
			t.block("meat")[0].set("activity_type_value", "0");
			t.block("meat")[0].set("activity_type_show", activity["activity_type"]);
			t.block("meat")[0].set("activity_status_value", "0");
			t.block("meat")[0].set("activity_status_show", activity["activity_status"]);
			t.block("meat")[0].set("activity_priority_value", "0");
			t.block("meat")[0].set("activity_priority_show", activity["activity_priority"]);
			t.block("meat")[0].set("who_preside_value", "0");
			t.block("meat")[0].set("who_preside_show", activity["who_preside"]);
			t.block("meat")[0].set("when_created", activity["when_created"]);
			t.block("meat")[0].set("note", activity["note"]);

			t.render( cs ); 
		}
		else {
			if(directory.compare("edit_activity") == 0){
			//edit interface javascript pull data
	//like listLeadrequest, query enum values
//			at.get_activity_types
//			at.get_activity_status
//			at.get_activity_priority
//			at.get_activity_preside

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
