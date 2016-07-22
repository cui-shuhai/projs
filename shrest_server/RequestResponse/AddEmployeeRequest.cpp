
#include <string>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>
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
#include "cookie_table.h"
#include "AddEmployeeRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddEmployeeRequest::AddEmployeeRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void AddEmployeeRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		string creator;
		int uid = 0;
		GetUser(uid, creator);

		auto content=rq_->content.string();
	
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		int id =0;
		{
			boost::regex re("%40");
			
			auto s = m["email"];

			boost::regex_replace( m["email"], re, "@");
			
			s = m["email"];

			employee_table e( -1, m["first_name"], m["last_name"],
					 stoi( m["age"] ), m["address"], m["mobile_phone"],
					 m["office_phone"], m["home_phone"], m["email"], 
					 stoi(m["job_title"]), stoi(m["department"]), stoi(m["report_to"]), utils::get_date(), uid);
		
			e.add_employee_table();

			id = e.get_employee_tableId();
		}
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );
		
		

		t.load( "web/addemployeeresponse.html" );

		t.block("meat").repeat(1);
		t.block("meat")[0].set("employee_id", to_string(id));
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
}
