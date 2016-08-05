


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
	try {
		stringstream cs;

		LoaderFile loader; 
		Template t( loader );
		t.load("web/edittaskinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("task_id", m["task_id"]);
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
	if(boost::iequals(m["action"], "list")){
	try {
		
		stringstream cs;

		string jstr;
		if(m.size() == 1){ //list employee
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listtask.html" );
			t.render( cs ); 
		}
		else{ //for adding employee
			string result;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("task_content") == 0){
				task_table tt;
				string empty_str;
				string resultset;
				tt.get_task_records(empty_str, jstr);
			}
			else if(directory.compare("edit_task") == 0){
				task_table tt;
				std::map<string, string> result;
				tt.set_task_id(m["task_id"]);
				tt.get_task_instance(result);
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

	}
}

void AddTaskInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){

	try {
		string id = utils::create_uuid();

		task_table tt( id, m["task_name"], m["due_date"], m["status"], m["description"], m["assignee"], m["assigner"], m["creator"]);
		tt.add_task_table();

	

		stringstream cs;
		cs << "task added" << endl; 
		
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

		task_table tt( m["task_id"], m["task_name"], m["due_date"], m["status"], m["description"], m["assignee"], m["assigner"], m["creator"]);
	
		tt.update_task_table();

		stringstream cs;

		cs << "task updated" << endl;
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}
