
#include <string>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customers_table.h"
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
		static int id = 10;
		Customer c( id++, m["firstname"], m["lastname"],stoi( m["age"] ), m["phone"], m["address"]);
		c.AddCustomer();

/*
		boost::regex re("([^=&]+)=([^&]+)");        // Create the reg exp
		boost::sregex_iterator pos(content.begin(), content.end(), re);
		boost::sregex_iterator end;
*/

		stringstream cs;
		
		cs << "Information:\n";

		for ( auto &c : m ) {
			cs << c.first << " = " << c.second << endl;
		}

		cs << "saved into database";

		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
