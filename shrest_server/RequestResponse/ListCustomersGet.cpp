


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customers_table.h"
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
		
		auto sql = "SELECT id_, firstName, lastName, age, phone, address FROM customer";

		auto customer_query = c.BuildQuery(sql);

		result_type res =  customer_query->emit_result();
	

		cs << "Customer List\n";

		do {
			cs << "customer_id: " << res->get_int(0) << endl;
				
			/* Access column data by alias or column name */
			cs << "first_name: " << res->get_string(1) << endl;
			cs << "last_name: " << res->get_string(2) << endl;
			cs << "age: " << res->get_int(3) << endl;
			cs << "phone: " << res->get_string(4) << endl;
			cs << "addres: " << res->get_string(5) << endl;
			/* Access column fata by numeric offset, 1 is the first column */
			cs << "------\n" << endl;
		}while (res->next_row());
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
