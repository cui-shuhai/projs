


#define BOOST_SPIRIT_THREADSAFE

#include "NLTemplate/NLTemplate.h"
#include "lead_table.h"
#include "contact_table.h"
#include "AddLeadInterface.h"

#include "shrest_utils.h"

using namespace std;
using namespace NL::Template;


AddLeadInterface::AddLeadInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}


void AddLeadInterface::ProcessGet() 
{
	LOG(rq_->method, rq_->path);
	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);

	if(boost::iequals(m["action"], "add")){
	     try {

			if(m.size() == 1)
			{
				stringstream content_stream;
				LoaderFile loader; // Let's use the default loader that loads files from disk.

				Template t( loader );

				t.load( "web/addleadinterface.html" );

				t.render( content_stream ); // Render the template with the variables we've set above
		 
				//find length of content_stream (length received using content_stream.tellp())
				
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
			t.load( "web/listlead.html" );
			t.render( cs ); 
		}
		else{ //for adding lead
			string result;
			lead_table lt;

			string directory = m["directory"];
			std::vector<string> resultset;

			if(directory.compare("lead_source") == 0){
				lt.get_lead_sources( resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(directory.compare("lead_status") == 0){
				lt.get_lead_statuss( resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(directory.compare("lead_rating") == 0){
				lt.get_lead_ratings(resultset); 
				utils::build_json(resultset, jstr); 
			}
			else if(directory.compare("lead_content") == 0){
				lt.get_lead_records("", jstr);
			}
			else if(directory.compare("add_customer") == 0){
				std::map<string, string> result;
				lt.get_lead_for_customer(result);
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
	if(boost::iequals(m["action"], "edit")){

	try {
		stringstream cs;

		auto id = m["lead_id"];
		lead_table lt;

		std::map<string, string> lead;
		lt.set_lead_id(id);
		lt.get_lead_instance(lead);
/*
                 t.block("meat")[0].set("lead_source_description", lt_get_lead_source_description());
                 t.block("meat")[0].set("lead_status_description", lt_get_lead_status_description());
                 t.block("meat")[0].set("lead_rating_description", lt_get_lead_rating_description());
*/
		LoaderFile loader; 

		Template t( loader );
		t.load("web/editleadinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("lead_id", lead["lead_id"]);
		t.block("meat")[0].set("company_name", lead["company_name"]);
		t.block("meat")[0].set("contact_name", lead["contact_name"]);
		t.block("meat")[0].set("personal_title", lead["personal_title"]);
		t.block("meat")[0].set("first_name", lead["first_name"]);
		t.block("meat")[0].set("last_name", lead["last_name"]);
		t.block("meat")[0].set("phone", lead["phone"]);
		t.block("meat")[0].set("email", lead["email"]);
		t.block("meat")[0].set("street_addr", lead["street_addr"]);
		t.block("meat")[0].set("city", lead["city"]);
		t.block("meat")[0].set("state", lead["state"]);
		t.block("meat")[0].set("post_code", lead["post_code"]);
		t.block("meat")[0].set("country", lead["country"]);
		t.block("meat")[0].set("bill_addr", lead["bill_addr"]);
		t.block("meat")[0].set("ship_addr", lead["ship_addr"]);

		t.render( cs ); 
		
		
		cs.seekp(0, ios::end);
		string page = cs.str();
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	
	}
}

void AddLeadInterface::ProcessPost() 
{
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){
	try {

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);
		string id = utils::create_uuid();
		lead_table c( id, m["company_name"], m["contact_name"], m["personal_title"], 
				m["first_name"], m["last_name"], m["phone"], m["email"], 
				m["street_addr"], m["city"], m["state"], m["post_code"], 
				m["country"], m["bill_addr"], m["ship_addr"], 
				m["lead_source"], m["lead_status"], m["lead_rating"]);

		c.add_lead_table();

		contact_table ct; 
		ct.set_contact_id(utils::create_uuid());
		ct.set_contact_from("lead");
		ct.set_first_name(m["first_name"]);
		ct.set_last_name(m["last_name"]);
		ct.set_company_id(id);

		ct.add_contact_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "new lead added" << endl;
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
	if(boost::iequals(m["submit"], "save")){
	try {

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);
		lead_table c( m["lead_id"], m["company_name"], m["contact_name"], m["personal_title"], 
				m["first_name"], m["last_name"], m["phone"], m["email"], 
				m["street_addr"], m["city"], m["state"], m["post_code"], 
				m["country"], m["bill_addr"], m["ship_addr"], 
				"web", "active", "normal");
				//stoi(m["lead_source"]), stoi(m["lead_status"]), stoi(m["lead_rating"]));

		c.update_lead_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "lead saved" << endl;
		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}

