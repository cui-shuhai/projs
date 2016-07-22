


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
void AddEmployeeInterface::Process(){
	LOG(rq_->method, rq_->path);
	
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/addemployeeinterface.html" );
		t.block("meat").repeat(1); 
		//fill title block
		if(true){
			std::map<int, string> titles;
			employee_title et;
			et.get_employee_titles(titles);
			Block & block = t.block( "meat" )[ 0 ].block( "titles" );

			auto rows = titles.size();
			block.repeat(rows);

			int i = 0;

			for(const auto & v : titles){
				block[i].set("title_value", to_string(v.first));
				block[i].set("title_show", v.second);
				++i;
			}
		}

		//fill department
		if(true){
			std::map<int, string> departments;
			employee_department et;
			et.get_employee_departments(departments);
			Block & block = t.block( "meat" )[ 0 ].block( "departments" );

			auto rows = departments.size();
			block.repeat(rows);

			int i = 0;

			for(const auto & v : departments){
				block[i].set("department_value", to_string(v.first));
				block[i].set("department_show", v.second);
				++i;
			}
		}


		//fill report to
		if(true){
			std::map<int, string> report_tos;
			employee_table et;
			et.get_department_managers(report_tos);
			Block & block = t.block( "meat" )[ 0 ].block( "report_to" );

			auto rows = report_tos.size();
			block.repeat(rows);

			int i = 0;

			for(const auto & v : report_tos){
				block[i].set("report_to_value", to_string(v.first));
				block[i].set("report_to_show", v.second);
				++i;
			}

		}


		//fill age
		if(true){

			Block & block = t.block( "meat" )[ 0 ].block( "ages" );

			block.repeat(80 - 16);

			int i = 0;

			for(int i = 16; i< 80; ++i){
				block[i].set("age_value", to_string(i));
				block[i].set("age_show", to_string(i));
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
}
