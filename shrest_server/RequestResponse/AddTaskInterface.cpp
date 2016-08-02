


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
#include "task_table.h"
#include "AddTaskInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddTaskInterface::AddTaskInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddTaskInterface::ProcessGet(){
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
		t.load( "web/addtaskinterface.html" );


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

	}
	if(boost::iequals(m["action"], "list")){

	}
}

void AddTaskInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){

	try {

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);
		task_table c( 0, m["task_name"], m["due_date"],stoi( m["status"] ), m["description"], stoi(m["assignee"]), stoi(m["assigner"]), stoi(m["creator"]));
		c.add_task_table();
		auto id = c.get_task_tableId();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addtaskresponse.html" );

		t.block("meat").repeat(1);
		t.block("meat")[0].set("task_id", to_string(id));
		t.block("meat")[0].set("task_name", m["task_name"]);
		t.block("meat")[0].set("due_date", m["due_date"]);
		t.block("meat")[0].set("status", m["status"]);
		t.block("meat")[0].set("description", m["description"]);
		t.block("meat")[0].set("assignee", m["assignee"]);
		t.block("meat")[0].set("assigner", m["assigner"]);
		t.block("meat")[0].set("creator", m["creator"]);
	

		stringstream cs;
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
	}
}
