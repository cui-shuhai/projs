


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "RequestResponseFactory.h"
#include "customer_table.h"
#include "SearchCustomerRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


SearchCustomerRequest::SearchCustomerRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void SearchCustomerRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		customer_table c;
		stringstream where;

		where << " WHERE ";

		bool first = true;


		for(auto &v : m)
		{
			if(!v.second.empty())
			{
				if(first == false)
					where << " AND ";
				else
					first = false;
					where << v.first << " == '" << v.second << "'";
			}
		}
		

		stringstream cs;
		
		string sql = "SELECT customer_id, first_name, last_name, phone, street_addr FROM customer";
		sql.append(where.str());

	//there is an error from sqlite library, query get_row_count fails (return 0)
		string count_sql = "SELECT count(*) FROM customer";
		count_sql.append(where.str());
		auto count_query = c.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		auto customer_query = c.BuildQuery(sql);

		result_type res =  customer_query->emit_result();
		
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/searchcustomerresponse.html" );

		
		t.block("meat").repeat(rows);

		//all fields must be string
 		for ( int i=0; i < rows; i++, res->next_row() ) {
			t.block("meat")[i].set("customerId", res->get_string(0));
			t.block("meat")[i].set("firstname", res->get_string(1));
			t.block("meat")[i].set("lastname", res->get_string(2));
			t.block("meat")[i].set("phone", res->get_string(3));
			t.block("meat")[i].set("address", res->get_string(4));
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
