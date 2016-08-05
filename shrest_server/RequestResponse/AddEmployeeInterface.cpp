


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "employee_table.h"
#include "employee_title.h"
#include "employee_department.h"
#include "AddEmployeeInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddEmployeeInterface::AddEmployeeInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/
void AddEmployeeInterface::ProcessGet(){
	LOG(rq_->method, rq_->path);

	std::map<string, string> m;
	string  params= rq_->get_params;
	utils::parse_get_params(params, m);
	
	if(boost::iequals(m["action"], "add")){
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/addemployeeinterface.html" );
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
		t.load("web/editemployeeinterface.html");
		t.block("meat").repeat(1);
		t.block("meat")[0].set("employee_id", m["employee_id"]);
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
			t.load( "web/listemployee.html" );
			t.render( cs ); 
		}
		else{ //for adding employee
			string result;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("employee_content") == 0){
				employee_table et;
				string empty_str;
				string resultset;
				et.get_employee_records(empty_str, jstr);
				//utils::build_json(resultset, jstr);
			}
			else if(directory.compare("job_title") == 0){
				employee_title et;
				std::vector<string> titles;
				et.get_employee_titles(titles);
				utils::build_json(titles, jstr);
			}
			else if(directory.compare("department_name") == 0){
				employee_department et;
				std::vector<string> departments;
				et.get_employee_departments(departments);
				utils::build_json(departments, jstr);
			}
			else if(directory.compare("report_to") == 0){
				std::map<string, string> report_tos;
				employee_table et;
				et.get_department_managers(report_tos);
				utils::build_json(report_tos, jstr);
			}
			else if(directory.compare("employee_instance") == 0){
				employee_table et;
				//string resultset;
				et.get_employee_instance(m["employee_id"], jstr);
				//utils::build_json(resultset, jstr);
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
void AddEmployeeInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);
	stringstream cs;

	if(boost::iequals(m["submit"], "add")){
	try {
		string creator;
		string uid ;
		GetUser(uid, creator);

		string id = utils::create_uuid();
		{

			if(m["report_to"].empty())
				m["report_to"] = id;
			employee_table e( id, m["first_name"], m["last_name"],
					 stoi( m["age"] ), m["address"], m["mobile_phone"],
					 m["office_phone"], m["home_phone"], m["email"], 
					 m["job_title"], m["department"], m["report_to"], utils::get_date(), uid);
		
			e.add_employee_table();

		}
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		cs << "employee added" << endl;
		//t.load( "web/addemployeeresponse.html" );

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

		employee_table e( m["employee_id"], m["first_name"], m["last_name"],
				 stoi( m["age"] ), m["address"], m["mobile_phone"],
				 m["office_phone"], m["home_phone"], m["email"], 
				 m["job_title"], m["department"], m["report_to"], m["create_date"], m["created_by"]);
	
		e.update_employee_table();


		cs << "employee updated" << endl;
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
	}
}
