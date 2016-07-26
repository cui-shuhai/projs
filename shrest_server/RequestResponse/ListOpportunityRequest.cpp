


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

#include "opportunity_table.h"
#include "ListOpportunityRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

ListOpportunityRequest::ListOpportunityRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListOpportunityRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		
		opportunity_table c;

		stringstream cs;
		
		//XXX it should be filtered by requester's id.

		auto uid = GetUserId();
	//there is an error from sqlite library, query get_row_count fails (return 0)
		string count_sql = "SELECT count(1) "
			" FROM opportunity INNER JOIN opportunity_pipeline ON opportunity_pipeline.pipeline_id = opportunity.opportunity "
			" WHERE assign_to = ";

		count_sql.append( uid );

		auto count_query = c.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		//if(rows == 0)

		string sql = "SELECT opportunity, opportunity_name, close_date, amount, opportunity_pipeline.name "
			" FROM opportunity INNER JOIN opportunity_pipeline ON opportunity_pipeline.pipeline_id = opportunity.opportunity "
			" WHERE assign_to = ";

		sql.append( uid );

			

		auto task_query = c.BuildQuery(sql);

		result_type res =  task_query->emit_result();
		
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/listopportunity.html" );

		
		t.block("meat").repeat(rows);

		//all fields must be string
 		for ( int i=0; i < rows; i++, res->next_row() ) {
			t.block("meat")[i].set("opportunity", res->get_string(0));
			t.block("meat")[i].set("opportunity_name", res->get_string(1));
			t.block("meat")[i].set("close_date", res->get_string(2));
			t.block("meat")[i].set("amount", res->get_string(3));
			t.block("meat")[i].set("pipeline", res->get_string(4));
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
