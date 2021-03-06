


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "campaign_table.h"
#include "cookie_table.h"
#include "AddCampaignInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

AddCampaignInterface::AddCampaignInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddCampaignInterface::ProcessGet(){

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

				t.load( "web/addcampaigninterface.html" );

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
		if(m.size() == 1){ //list 
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listcampaign.html" );
			t.render( cs ); 
		}
		else{ //for adding 
		
			string result;
			campaign_table ct;
			string directory = m["directory"];

			if(directory.compare("campaign_content") == 0){
				ct.get_campaign_records("", jstr);
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

		auto id = m["campaign_id"];
		campaign_table ct;

		std::map<string, string> campaign;
		ct.set_campaign_id(id);
		ct.get_campaign_instance(campaign);

		LoaderFile loader; 

		Template t( loader );
		t.load("web/editcampaigninterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("campaign_id", campaign["campaign_id"]);
		t.block("meat")[0].set("campaign_name", campaign["campaign_name"]);
		t.block("meat")[0].set("assign_to", campaign["assign_to"]);
		t.block("meat")[0].set("campaign_status", campaign["campaign_status"]);
		t.block("meat")[0].set("creator_id", campaign["creator_id"]);
		t.block("meat")[0].set("start_date", campaign["start_date"]);
		t.block("meat")[0].set("close_date", campaign["close_date"]);
		t.block("meat")[0].set("description", campaign["description"]);

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

void AddCampaignInterface::ProcessPost() 
{
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){
	try {

		string id = utils::create_uuid();
		campaign_table c( id, m["campaign_name"], m["assign_to"], m["campaign_status"], m["creator_id"], m["start_date"], m["close_date"], m["description"] );

		c.add_campaign_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "new campaign added" << endl;
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
		campaign_table c( m["campaign_id"], m["campaign_name"], m["assign_to"], m["campaign_status"], m["creator_id"], m["start_date"], m["close_date"], m["description"] );

		c.update_campaign_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "campaign saved" << endl;
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

