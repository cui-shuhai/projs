


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
#include "ListActivityRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListActivityRequest::ListActivityRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListActivityRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string jstr;
		if(m.size() == 0){ //list lead
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listactivity.html" );
			t.render( cs ); 
		}
		else{ //for adding lead
			string result;
			activity_table ct;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("activity_content") == 0){
				ct.get_activity_records("", jstr);
			}
			utils::build_raw_response( jstr);
			rs_ << jstr;
			return;
		}
		
/*
		auto count_sql = "SELECT count(1) FROM activity";
		auto count_query = c.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		auto task_query = c.BuildQuery(sql);

		result_type res =  task_query->emit_result();
		
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/listactivity.html" );

		
		t.block("meat").repeat(rows);

		//all fields must be string
 		for ( int i=0; i < rows; i++, res->next_row() ) {
			t.block("meat")[i].set("activity_name", res->get_string(1));
			t.block("meat")[i].set("activity_type", res->get_string(2));
			t.block("meat")[i].set("activity_status", res->get_string(3));
			t.block("meat")[i].set("activity_priority", res->get_string(4));
			t.block("meat")[i].set("who_preside", res->get_string(5));
			t.block("meat")[i].set("when_created", res->get_string(6));
			t.block("meat")[i].set("note", res->get_string(7));
		}


		t.render( cs ); // Render the template with the variables we've set above
*/
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
