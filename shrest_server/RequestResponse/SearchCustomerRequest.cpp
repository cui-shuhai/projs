


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

#include "RequestResponseFactory.h"
#include "customers_table.h"
#include "SearchCustomerRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

SearchCustomerRequest::SearchCustomerRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void SearchCustomerRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		Customer c;
		stringstream where;

		where << " WHERE ";

		bool first = true;


		for(auto &v : m)
		{
			if(!v.second.empty())
			{
				if(first == false)
					where << " OR ";
				else
					first = false;
				if( v.first == "id_" || v.first == "age")
					where << v.first << " == " << v.second;
				else
					where << v.first << " == '" << v.second << "'";
			}
		}
		

		//no search condition redirect to ListCustomersGet
		if(first){
			auto processor = RequestResponseFactory::CreateProcessor("ListCustomersGet", rs_, rq_);	
			processor->Process();
			return;    
		}
				

		stringstream cs;
		
		string sql = "SELECT id_, firstName, lastName, age, phone, address FROM customer";
		sql.append(where.str());

	//there is an error from sqlite library, query get_row_count fails (return 0)
		string count_sql = "SELECT count(*) FROM customer";
		count_sql.append( where.str() );
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
			t.block("meat")[i].set("customerId", to_string(res->get_int(0)));
			t.block("meat")[i].set("firstname", res->get_string(1));
			t.block("meat")[i].set("lastname", res->get_string(2));
			t.block("meat")[i].set("age", to_string(res->get_int(3)));
			t.block("meat")[i].set("phone", res->get_string(4));
			t.block("meat")[i].set("address", res->get_string(5));
			t.block("meat")[i].set("activities", to_string(res->get_int(0)));
			t.block("meat")[i].set("transactions", to_string(res->get_int(0)));

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
