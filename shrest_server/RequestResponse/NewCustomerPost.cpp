
#include <string>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "NewCustomerPost.h"

using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

NewCustomerPost::NewCustomerPost(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void NewCustomerPost::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		int id = 10;
		Customer c(id,  m["company_name"], m["contact_name"], m["personal_title"], 
			m["first_name"], m["last_name"], m["phone"], m["email"], 
			m["street_addr"], m["city"], m["state"], m["post_code"], m["country"], 
			m["bill_addr"], m["ship_addr"]);
		c.AddCustomer();
		id = c.GetCustomerId();

		stringstream cs;		

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addcustomerrequest.html" );


		t.render( cs ); // Render the template with the variables we've set above
 
		//find length of content_stream (length received using content_stream.tellp())
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
