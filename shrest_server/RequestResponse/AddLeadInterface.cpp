


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
				LoaderFile loader; 

				Template t( loader );

				t.load( "web/addleadinterface.html" );

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
				lt.get_lead_records(filter , jstr);
			}
			else if(directory.compare("add_customer") == 0){
				std::map<string, string> result;
				lt.get_lead_for_customer(result);
				utils::build_json(result, jstr); 
			}
			else if(directory.compare("edit_lead") == 0 || directory.compare("edit_lead_desktop") == 0){
				lt.set_lead_id(m["lead_id"]);
				std::map<string, string> result;
				lt.get_lead_instance(result);
				utils::build_json(result, jstr); 
			}

			utils::build_raw_response( jstr);
			rs_ << jstr;

			LOG( "response : ", jstr);
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

		return;
	}
	if(boost::iequals(m["action"], "edit")){

	try {
		stringstream cs;

		//lead_table lt;

		//std::map<string, string> lead;
		//lt.set_lead_id(id);
		//lt.get_lead_instance(lead);
		LoaderFile loader; 

		Template t( loader );
		t.load("web/editleadinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("lead_id", m["lead_id"]);
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

void AddLeadInterface::ProcessPost() 
{
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){
	try {

		string id = utils::create_uuid();
		lead_table c( m["lead_id"], m["company_name"], m["contact_name"], m["personal_title"], 
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

		//LoaderFile loader; 

		//Template t( loader );

		//t.render( cs ); 
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
	else{
	//if(boost::iequals(m["submit"], "save")){
	try {

		lead_table c( m["lead_id"], m["company_name"], m["contact_name"], m["personal_title"], 
				m["first_name"], m["last_name"], m["phone"], m["email"], 
				m["street_addr"], m["city"], m["state"], m["post_code"], 
				m["country"], m["bill_addr"], m["ship_addr"], 
				"web", "active", "normal");

		c.update_lead_table();


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

