
#include <string>
#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed in 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "customer_table.h"
#include "user_table.h"
#include "cookie_table.h"
#include "compaign_table.h"
#include "task_table.h"
#include "activity_table.h"
#include "opportunity_table.h"
#include "RequestResponse.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;



RequestResponse::RequestResponse(HttpServer::Response &rs, ShRequest rq):
		rs_(rs), rq_(rq){}

RequestResponse::~RequestResponse(){}

bool RequestResponse::GetSession(std::string& session){
	auto cookies = rq_->cookies;
		
	if(!cookies.empty()){

		boost::regex re("Cookie:\\s* secret_key=([^&; ]+)\\r", boost::regex::icase); 
		boost::smatch what; 
		if (regex_match(cookies, what, re)){
			session = what[1].str();
			return true;
		}   	
	}
	return false;
}

void RequestResponse::CreateDashboard(const string & username, const string password){

LOG(rq_->method, rq_->path);

	try {
		
		//check list of tables to show progress, what to do
		//compaigns, opportunities, activities, 
		string key;
		GetSession(key);

		cookie_table ckt(key);
		auto user_id = ckt.get_user_id();


		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/userdashboard.html");
		t.block("meat").repeat(1); 

		//Compaigns
		if(true){
			string compaign_sql = "SELECT compaign_name, status, start_date, close_date, description FROM compaign WHERE assign_to = ";
			compaign_sql.append(to_string(user_id)).append(" ORDER BY status");
		
			compaign_table ct;
			auto cp_query = ct.BuildQuery(compaign_sql);
			auto res = cp_query->emit_result();

			string count_sql = "SELECT count(*) FROM compaign WHERE assign_to = ";
			count_sql.append(to_string(user_id));

			auto count_query = ct.BuildQuery(count_sql);
			auto count_res = count_query->emit_result();
			auto rows = count_res->get_int(0);

	

			t.block("meat")[0].set("compaign_num", to_string(rows));

			Block & block = t.block( "meat" )[ 0 ].block( "compaign_block" );

			block.repeat(rows);
			//all fields must be string
	 		for ( int i=0; i < rows; i++, res->next_row() ) {
				block.set("compaien_name", res->get_string(0));
				block.set("description", res->get_string(1));
				block.set("status", res->get_string(2));
				block.set("start_date", res->get_string(3));
				block.set("close_date", res->get_string(4));
			}
		}
	
		//Opportunities
		if(true){
			string opportunity_sql = "SELECT opportunity_name, firstName, lastName, opportunity.contact_id, pipeline, amount, probability, close_date FROM opportunity JOIN contact ON opportunity.contact_id = contact.contact_id WHERE assign_to = ";
			opportunity_sql.append(to_string(user_id)).append(" ORDER BY pipeline");
		
			activity_table ot;
			auto ot_query = ot.BuildQuery(opportunity_sql);
			auto res = ot_query->emit_result();

			string count_sql = "SELECT count(1) FROM opportunity JOIN contact ON opportunity.contact_id = contact.contact_id WHERE assign_to = ";
			count_sql.append(to_string(user_id));

			auto count_query = ot.BuildQuery(count_sql);
			auto count_res = count_query->emit_result();
			auto rows = count_res->get_int(0);	
			
			t.block("meat")[0].set("opportunity_num", to_string(rows));

			Block & block = t.block( "meat" )[ 0 ].block( "opportunity_block" );

			block.repeat(rows);
			//all fields must be string
	 		for ( int i=0; i < rows; i++, res->next_row() ) {
				block.set("opportunity", res->get_string(0));
				block.set("id", to_string(res->get_int(3)));
				block.set("contactee", res->get_string(1) + " " + res->get_string(2));
				block.set("pipeline", res->get_string(4)); 
				block.set("amount", to_string(res->get_double(5))); 
				block.set("probablity", to_string(res->get_int(6))); 
				block.set("close_date", res->get_string(7));
			}
		}


		//activities
		if(true){
			string activity_sql = "SELECT  firstName, lastName,  activity.activity_name, activity_type.description, "
						"activity_status.description, activity_priority.description, note, when_created " 
						" FROM activity INNER JOIN activity_type ON activity_type.activity_type = activity.activity_type "
						"INNER JOIN activity_status ON activity.activity_status = activity_status.activity_status "
						"INNER JOIN activity_priority ON activity_priority.activity_priority = activity.activity_priority "
						"INNER JOIN employee ON employee.employee_id = activity.who_preside" 
						"  WHERE activity.who_preside = ";
			activity_sql.append(to_string(user_id)).append(" ORDER BY activity.when_created");
		
			activity_table at;
			auto at_query = at.BuildQuery(activity_sql);
			auto res = at_query->emit_result();

			string count_sql = "SELECT count(1) FROM activity INNER JOIN activity_type ON activity_type.activity_type = activity.activity_type "
						"INNER JOIN activity_status ON activity.activity_status = activity_status.activity_status "
						"INNER JOIN activity_priority ON activity_priority.activity_priority = activity.activity_priority "
						"INNER JOIN employee ON employee.employee_id = activity.who_preside" 
						"  WHERE activity.who_preside = ";
			count_sql.append(to_string(user_id));

			auto count_query = at.BuildQuery(count_sql);
			auto count_res = count_query->emit_result();
			auto rows = count_res->get_int(0);	
			
			t.block("meat")[0].set("activity_num", to_string(rows));

			Block & block = t.block( "meat" )[ 0 ].block( "activity_block" );

			block.repeat(rows);
			//all fields must be string
	 		for ( int i=0; i < rows; i++, res->next_row() ) {
				block.set("activity_name", res->get_string(2 ));
				block.set("activity_type", res->get_string(3));
				block.set("activity_status", res->get_string(4));
				block.set("activity_priority", res->get_string(5)); 
				block.set("who_preside", res->get_string(0) + " " + res->get_string(1)  ); 
				block.set("when_created", res->get_string(7)); 
				block.set("note", res->get_string(6)); 
			}
		}

		//tasks
		if(true){
			string task_sql = "SELECT task_name, task.description, task_status.description, due_date  " 
" FROM task INNER JOIN task_status ON task.status = task_status.status_id WHERE task.assignee = ";
			task_sql.append(to_string(user_id)).append(" ORDER BY due_date");
		
			task_table tt;
			auto tt_query = tt.BuildQuery(task_sql);
			auto res = tt_query->emit_result();

			string count_sql = "SELECT count(1)  FROM task INNER JOIN task_status ON task.status = task_status.status_id WHERE task.assignee = ";
			count_sql.append(to_string(user_id));

			auto count_query = tt.BuildQuery(count_sql);
			auto count_res = count_query->emit_result();
			auto rows = count_res->get_int(0);	
			
			t.block("meat")[0].set("task_num", to_string(rows));

			Block & block = t.block( "meat" )[ 0 ].block( "task_block" );

			block.repeat(rows);
			//all fields must be string
	 		for ( int i=0; i < rows; i++, res->next_row() ) {
				block.set("task", res->get_string(0));
				block.set("description", to_string(1));
				block.set("status", res->get_string(2));
				block.set("due_date", res->get_string(3)); 
			}
		}

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


int RequestResponse::GetUserId(){

	auto cookies = rq_->cookies;
	if(!cookies.empty()){
		string key;
		if(GetSession(key)){
			cookie_table ct{key};
			ct.get_cookie_user();
			return ct.get_user_id();
		}
	}

	return -1;
}

void  RequestResponse::GetUser(int &uid, string& name){

	auto cookies = rq_->cookies;
	if(!cookies.empty()){
		string key;
		if(GetSession(key)){
			cookie_table ct{key};
			ct.get_cookie_user();
			name = ct.get_user_name();
			uid = ct.get_user_id();
		}
	}
}
