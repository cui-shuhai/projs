


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
#include "user_table.h"
#include "employee_profile.h"
#include "employee_role.h"
#include "AddUserInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddUserInterface::AddUserInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

/*parse customer information and put into database*/
void AddUserInterface::ProcessGet(){
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
		t.load( "web/adduserinterface.html" );
		t.block("meat").repeat(1); 
		
		if(true){
			employee_table et;
			std::map<string, string> employees;
			et.get_employee_list(employees);
			auto rows = employees.size();

			Block & block = t.block( "meat" )[ 0 ].block( "user_block" );
			block.repeat(rows);
			int i = 0;
			for(const auto & v : employees){
				block[i].set("user_value", v.first);
				block[i].set("user_show", v.second);
				++i;
			}
		}

		//role
		if(true){
			employee_role rt;
			std::vector<string> roles;
			rt.get_employee_roles(roles);
			auto rows = roles.size();

			Block & block = t.block( "meat" )[ 0 ].block( "role_block" );
			block.repeat(rows);
			int i = 0;
			for(const auto & v : roles){
				block[i].set("role_value", v);
				block[i].set("role_show", v);
				++i;
			}
		}

		//profile
		if(true){
			employee_profile pt;
			std::vector<string> profiles;
			pt.get_employee_profiles(profiles);
			auto rows = profiles.size();

			Block & block = t.block( "meat" )[ 0 ].block( "profile_block" );
			block.repeat(rows);
			int i = 0;
			for(const auto & v : profiles){
				block[i].set("profile_value", v);
				block[i].set("profile_show", v);
				++i;
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
		if(m.size() == 0){ //list user
			LoaderFile loader; 
			Template t( loader );
			t.load( "web/listuser.html" );
			t.render( cs ); 
		}
		else{ //for adding user
			string result;
			user_table ut;

			string directory = m["directory"];
			std::map<int, string> resultset;

			if(directory.compare("user_content") == 0){
				ut.get_user_records("", jstr);
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

void AddUserInterface::ProcessPost(){
	LOG(rq_->method, rq_->path);

	auto content=rq_->content.string();
	std::map<std::string, std::string> m;
	utils::parse_kye_value(content, m);

	if(boost::iequals(m["submit"], "add")){

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);


		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		user_table u(m["login_name"], m["pass_word"], m["new_user"] , m["role_name"], m["profile_name"], utils::get_date(), GetUserId());

		if(!u.check_user_exist())
		{
			u.add_user_table();

			t.load( "web/adduserresponse.html" );
		}
		else
		{
			t.load( "web/adduserexistwarning.html" );
		}

		t.block("meat").repeat(1);
		t.block("meat")[0].set("login_name",m["login_name"]);


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
