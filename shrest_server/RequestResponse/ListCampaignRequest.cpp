


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

#include "campaign_table.h"
#include "cookie_table.h"
#include "ListCampaignRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

ListCampaignRequest::ListCampaignRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListCampaignRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		
		string key;
		GetSession(key);

		cookie_table ckt(key);
		auto user_id = ckt.get_user_id();	

		
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/listcampaign.html" );

		stringstream cs;
		campaign_table ct;
		
		//XXX it should be filtered by requester's id.

		//string count_sql = "SELECT count(*) FROM campaign WHERE assign_to = ";
		//count_sql.append(to_string(user_id));
		string count_sql = "SELECT count(*) FROM campaign";

		auto count_query = ct.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		if(rows > 0){
			/* 
			string campaign_sql = "SELECT campaign_name, status, start_date, close_date, description FROM campaign WHERE assign_to = ";
			campaign_sql.append(to_string(user_id)).append(" ORDER BY status");
			*/
		
			string campaign_sql = "SELECT campaign_id, campaign_name, campaign_status.name, start_date, description "
				"FROM campaign INNER JOIN campaign_status ON campaign.status = campaign_status.status_id";
			campaign_sql.append(" ORDER BY start_date");
			campaign_table ct;
			auto cp_query = ct.BuildQuery(campaign_sql);
			auto res = cp_query->emit_result();

			t.block("meat").repeat(rows);
			//all fields must be string
	 		for ( int i=0; i < rows; i++, res->next_row() ) {
				t.block("meat")[i].set("campaign_id", res->get_string(0));
				t.block("meat")[i].set("campaign_name", res->get_string(1));
				t.block("meat")[i].set("description", res->get_string(4));
				t.block("meat")[i].set("status", res->get_string(2));
				t.block("meat")[i].set("start_date", res->get_string(3));
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
