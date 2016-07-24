


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "case_table.h"
#include "cookie_table.h"
#include "ListCaseRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

ListCaseRequest::ListCaseRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListCaseRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		
		string key;
		GetSession(key);

		cookie_table ckt(key);
		auto user_id = ckt.get_user_id();	

		
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/listcase.html" );

		stringstream cs;
		case_table ct;
		
		//XXX it should be filtered by requester's id.

		//string count_sql = "SELECT count(*) FROM case WHERE assign_to = ";
		//count_sql.append(to_string(user_id));
		string count_sql = "SELECT count(*) FROM case_tbl INNER JOIN case_status ON case_tbl.status = case_status.status "
				"INNER JOIN case_priority ON case_tbl.priority = case_priority.priority ";

		auto count_query = ct.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		if(rows > 0){
		
			string case_sql = "SELECT case_id, subject, case_status.description, case_priority.description, last_activity, next_activity "
				"FROM case_tbl INNER JOIN case_status ON case_tbl.status = case_status.status "
				"INNER JOIN case_priority ON case_tbl.priority = case_priority.priority "
				"ORDER By case_tbl.priority";

			case_table ct;
			auto cp_query = ct.BuildQuery(case_sql);
			auto res = cp_query->emit_result();

			t.block("meat").repeat(rows);
			//all fields must be string
	 		for ( int i=0; i < rows; i++, res->next_row() ) {
				t.block("meat")[i].set("case_id", to_string(res->get_int(0)));
				t.block("meat")[i].set("subject", res->get_string(1));
				t.block("meat")[i].set("status", res->get_string(2));
				t.block("meat")[i].set("priority", res->get_string(3));
				t.block("meat")[i].set("last_activity", res->get_string(4));
				t.block("meat")[i].set("next_activity", res->get_string(5));
			}
		}


		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
