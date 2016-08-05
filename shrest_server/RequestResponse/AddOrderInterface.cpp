


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "order_table.h"
#include "AddOrderInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddOrderInterface::AddOrderInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddOrderInterface::ProcessGet(){
	LOG(rq_->method, rq_->path);

	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);
//load adding interface
	if(boost::iequals(m["action"], "add")){
	
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/addorderinterface.html" );


		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
		return;
	}
	if(boost::iequals(m["action"], "edit")){

	try {
		stringstream cs;

		//order_table ot;

		//std::map<string, string> order;
		//ot.set_order_id(id);
		//ot.get_order_instance(order);
		LoaderFile loader; 

		Template t( loader );
		t.load("web/editorderinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("order_id", m["order_id"]);
		t.render( cs ); 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}

	}
	if(boost::iequals(m["action"], "list")){
	try {
		
		stringstream cs;
		string jstr;

		if(m.size() == 1){ //list order
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listorder.html" );
			t.render( cs ); 
		}
		else{ //for adding order
			string result;
			order_table ot;

			string directory = m["directory"];
			std::vector<string> resultset;

			if(directory.compare("order_content") == 0){
				ot.get_order_records("", jstr);
			}
			else if(directory.compare("edit_order") == 0){
				ot.set_order_id(m["order_id"]);
				std::map<string, string> result;
				ot.get_order_instance(result);
				utils::build_json(result, jstr); 
			}


			utils::build_raw_response( jstr);
			rs_ << jstr;
			return;
		}
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}

		return;

	}
}

void AddOrderInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){

	try {
		string id = utils::create_uuid();

		order_table ot( id,  m["customer_id"] , m["product_id"] ,stod( m["order_amount"] ), m["order_date"] , m["order_status"] );


		ot.add_order_table();

		stringstream cs;

		cs << "new lead added" << endl;
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		

		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
		return;
	}
	if(boost::iequals(m["submit"], "save")){
	try {

		order_table ot(  m["order_id"] , m["customer_id"] , m["product_id"] ,stod( m["order_amount"] ), m["order_date"] , m["order_status"] );

		ot.update_order_table();


		stringstream cs;

		cs << "lead saved" << endl;
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();

		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}
