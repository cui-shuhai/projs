


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
		t.block("meat").repeat(1); 
		//fill title block
		if(true){
			std::vector<string> titles;
			employee_title et;
			et.get_employee_titles(titles);
			Block & block = t.block( "meat" )[ 0 ].block( "titles" );

			auto rows = titles.size();
			block.repeat(rows);

			int i = 0;

			for(const auto & v : titles){
				block[i].set("title_value", v);
				block[i].set("title_show", v);
				++i;
			}
		}

		//fill department
		if(true){
			std::vector<string> departments;
			employee_department et;
			et.get_employee_departments(departments);
			Block & block = t.block( "meat" )[ 0 ].block( "departments" );

			auto rows = departments.size();
			block.repeat(rows);

			int i = 0;

			for(const auto & v : departments){
				block[i].set("department_value", v);
				block[i].set("department_show", v);
				++i;
			}
		}


		//fill report to
		if(true){
			std::map<string, string> report_tos;
			auto rows = report_tos.size();
			employee_table et;
			et.get_department_managers(report_tos);

			Block & block = t.block( "meat" )[ 0 ].block( "report_to" );

			rows = report_tos.size();
			
			block.repeat(rows);

			int i = 0;

			for(const auto & v : report_tos){
				block[i].set("report_to_value", v.first);
				block[i].set("report_to_show", v.second);
				++i;
			}

		}


		//fill age
		if(true){

			Block & block = t.block( "meat" )[ 0 ].block( "ages" );

			block.repeat(80 - 16);
			const int count = 60;
			block.repeat(count);

			int i = 0;

			for(int i = 0; i< count; ++i){
				block[i].set("age_value", to_string(i + 16));
				block[i].set("age_show", to_string(i + 16));
			}
		}
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

	try {
		
		std::map<string, string> m;
		stringstream cs;
		string  params= rq_->get_params;
		utils::parse_get_params(params, m);

		string jstr;
		if(m.size() == 1){ //list employee
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listemployee.html" );
			t.render( cs ); 
		}
		else{ //for adding employee
			string result;
			employee_table et;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("employee_content") == 0){
				et.get_employee_records("", jstr);
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

	if(boost::iequals(m["submit"], "add")){
	try {
		string creator;
		string uid ;
		GetUser(uid, creator);

		auto content=rq_->content.string();
	
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		string id = utils::create_uuid();
		{
			boost::regex re("%40");
			
			auto s = m["email"];

			boost::regex_replace( m["email"], re, "@");
			
			s = m["email"];

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
		
		

		t.load( "web/addemployeeresponse.html" );

		t.block("meat").repeat(1);
		t.block("meat")[0].set("employee_id", id);
		t.block("meat")[0].set("first_name", m["first_name"]);
		t.block("meat")[0].set("last_name",m["last_name"]);
		t.block("meat")[0].set("job_title", m["job_title"]);
		t.block("meat")[0].set("department", m["department"]);
		t.block("meat")[0].set("report_to", m["report_to"]);
		t.block("meat")[0].set("age",  m["age"]);
		t.block("meat")[0].set("address", m["address"]);
		t.block("meat")[0].set("email", m["email"]);
		t.block("meat")[0].set("mobile_phone", m["mobile_phone"]);
		t.block("meat")[0].set("office_phone", m["office_phone"]);
		t.block("meat")[0].set("creator", creator);

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
