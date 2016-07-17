


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customers_table.h"
#include "ListCustomersGet.h"

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
	#if 0	
		c.SetStatement("SELECT * FROM crm_template");
		auto& res = c.GetResultset();
		cs << "Customer List\n";

		while (res->next()) {
			cs << "customer_id: " << res->getInt("customer_id") << endl;
				
			/* Access column data by alias or column name */
			cs << "first_name: " << res->getString("first_name") << endl;
			cs << "last_name: " << res->getString("last_name") << endl;
			cs << "age: " << res->getInt("age") << endl;
			cs << "phone: " << res->getString("phone") << endl;
			cs << "address: " << res->getString("address") << endl;
			/* Access column fata by numeric offset, 1 is the first column */
			cs << "------\n" << endl;
		}
		#endif
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
