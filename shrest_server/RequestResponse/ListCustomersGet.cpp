


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

#include "customer_table.h"
#include "ListCustomersGet.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

ListCustomersGet::ListCustomersGet(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void ListCustomersGet::Process(){
	LOG(rq_->method, rq_->path);

	try {
		
		Customer c;

		stringstream cs;
		
		auto sql = "SELECT customer_id, company_name, first_name, last_name, "
				" phone, email, street_addr, city, state, country, bill_addr, ship_addr, personal_title , post_code   FROM customer";

	//there is an error from sqlite library, query get_row_count fails (return 0)
		auto count_sql = "SELECT count(*) FROM customer";
		auto count_query = c.BuildQuery(count_sql);
		auto count_res = count_query->emit_result();
		auto rows = count_res->get_int(0);

		auto customer_query = c.BuildQuery(sql);

		result_type res =  customer_query->emit_result();
		
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/listcustomers.html" );

		
		t.block("meat").repeat(rows);

		//all fields must be strings

 		for ( int i=0; i < rows; i++, res->next_row() ) {
 
			t.block("meat")[i].set("customer_id",to_string( res->get_int(0)));
			t.block("meat")[i].set("company_name", res->get_string(1));
			t.block("meat")[i].set("contact_name", res->get_string(2) + " " + res->get_string(3));
			t.block("meat")[i].set("personal_title", res->get_string(12));
			t.block("meat")[i].set("first_name", res->get_string(2));
			t.block("meat")[i].set("last_name", res->get_string(3));
			t.block("meat")[i].set("phone", res->get_string(4));
			t.block("meat")[i].set("email", res->get_string(5));
			t.block("meat")[i].set("street_addr", res->get_string(6));
			t.block("meat")[i].set("city", res->get_string(7));
			t.block("meat")[i].set("state", res->get_string(8));
			t.block("meat")[i].set("country", res->get_string(9));
			t.block("meat")[i].set("bill_addr", res->get_string(10));
			t.block("meat")[i].set("ship_addr", res->get_string(11));
			t.block("meat")[i].set("post_code", res->get_string(13));

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
