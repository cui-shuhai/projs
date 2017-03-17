


#define BOOST_SPIRIT_THREADSAFE

#include "NLTemplate/NLTemplate.h"
#include "AddCustomerInterface.h"

#include "shrest_utils.h"
#include "customer_table.h"
#include "contact_table.h"

using namespace std;
using namespace NL::Template;


AddCustomerInterface::AddCustomerInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

void AddCustomerInterface::ProcessGet(){

	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);

	if(boost::iequals(m["action"], "add")){
	     try {

		if(m.size() == 1)
		{
			stringstream content_stream;
			LoaderFile loader; 

			Template t( loader );

			t.load( "web/addcustomerinterface.html" );

			t.render( content_stream );
			
			content_stream.seekp(0, ios::end);
			rs_ <<  content_stream.rdbuf();
			rs_.flush();
		}
	    }
	    catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	    }
		return;
	}

	
	if(boost::iequals(m["action"], "list")){
	try {
		stringstream cs;
		string jstr;

		if(m.size() == 1){ //list lead
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listcustomers.html" );
			t.render( cs ); 
		}
		else{ //for adding lead
			string result;

			string directory = m["directory"];

			if( directory.compare("add_contact") == 0){
			}
			else if( directory.compare("customer_content") == 0){
				string filter;
				stringstream ss;
				bool first = true;
				for( const auto & v : m )
				{
					if(v.first.compare("action") == 0)
						continue;
					if(v.first.compare("directory") == 0)
						continue;

					if(first)
						first = ! first;
					else 
						ss << " AND ";
					ss << v.first <<  " = " << "'" << v.second << "'" ;
	
				}
				filter = ss.str();
				customer_table ct;
				ct.get_customer_records(filter, jstr);
			}
			else if( directory.compare("last_name") == 0){
				customer_table ct;
				ct.get_last_names("", jstr);
			}
			else if(directory.compare("edit_customer") == 0 || directory.compare("edit_customer_desktop") == 0){
				customer_table ct;
				ct.set_customer_id(m["customer_id"]);
				std::map<string, string> result;
				ct.get_customer_instance(result);
				utils::build_json(result, jstr); 
			}

			utils::build_raw_response( jstr);
			rs_ << jstr;
			LOG("response: ",  jstr);
			rs_.flush();
			return;
		}
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}

	if(boost::iequals(m["action"], "edit")){
	try {
		stringstream cs;

		auto id = m["customer_id"];
		/*
		customer_table ct;

		std::map<string, string> customer;
		ct.set_customer_id(id);
		ct.get_customer_instance(customer);
		*/

		LoaderFile loader; 

		Template t( loader );
		t.load("web/editcustomerinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("customer_id", m["customer_id"]);
		/*
		t.block("meat")[0].set("company_name", customer["company_name"]);
		t.block("meat")[0].set("contact_name", customer["contact_name"]);
		t.block("meat")[0].set("personal_title", customer["personal_title"]);
		t.block("meat")[0].set("first_name", customer["first_name"]);
		t.block("meat")[0].set("last_name", customer["last_name"]);
		t.block("meat")[0].set("phone", customer["phone"]);
		t.block("meat")[0].set("email", customer["email"]);
		t.block("meat")[0].set("street_addr", customer["street_addr"]);
		t.block("meat")[0].set("city", customer["city"]);
		t.block("meat")[0].set("state", customer["state"]);
		t.block("meat")[0].set("post_code", customer["post_code"]);
		t.block("meat")[0].set("country", customer["country"]);
		t.block("meat")[0].set("bill_addr", customer["bill_addr"]);
		t.block("meat")[0].set("ship_addr", customer["ship_addr"]);
		*/

		t.render( cs ); 
		
		
		cs.seekp(0, ios::end);
		string page = cs.str();
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
		return;
	}

}

void AddCustomerInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){

	try {
		auto content=rq_->content.string();

		string id = utils::create_uuid();
		customer_table c(id,  m["company_name"], m["contact_name"], m["personal_title"], 
			m["first_name"], m["last_name"], m["phone"], m["email"], 
			m["street_addr"], m["city"], m["state"], m["post_code"], m["country"], 
			m["bill_addr"], m["ship_addr"]);

		c.add_customer_table();

		contact_table ct; 
		ct.set_contact_id(utils::create_uuid());
		ct.set_contact_from("customer");
		ct.set_first_name(m["first_name"]);
		ct.set_last_name(m["last_name"]);
		ct.set_company_id(id);

		ct.add_contact_table();

		stringstream cs;		

		//LoaderFile loader; 

		//Template t( loader );

		//t.load( "web/addcustomerrequest.html" );

		//t.render( cs ); 
		cs << "new customer added" << endl;
		
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

		customer_table c( m["customer_id"], m["company_name"], m["contact_name"], m["personal_title"], 
				m["first_name"], m["last_name"], m["phone"], m["email"], 
				m["street_addr"], m["city"], m["state"], m["post_code"], 
				m["country"], m["bill_addr"], m["ship_addr"] );

		c.update_customer_table();

		LoaderFile loader; 

		Template t( loader );

		stringstream cs;

		cs << "customer saved" << endl;
		t.render( cs ); 
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}
