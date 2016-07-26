


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "activity_table.h"
#include "activity_status.h"
#include "activity_type.h"
#include "activity_priority.h"
#include "user_table.h"
#include "AddActivityInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddActivityInterface::AddActivityInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddActivityInterface::Process(){
	LOG(rq_->method, rq_->path);
	
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/addactivityinterface.html" );
#if 1
	               t.block("meat").repeat(1); 
	               //activity_table at;
	           
	               {
			       activity_type at;
	                       Block & block = t.block( "meat" )[ 0 ].block( "typeblock" );
	                       std::map<int, string> types;
	
	                       at.get_activity_type(types);
	                       auto rows = types.size();
	                       block.repeat(rows);
	                       int i = 0;
	                       for(const auto &v : types){
	                               block[i].set("activity_type_value", to_string(v.first));
	                               block[i].set("activity_type_show", v.second);
					++i;
	                       }
	               }
	               {
			       activity_status at;
	                       Block & block = t.block( "meat" )[ 0 ].block( "statusblock" );
	                       std::vector<string> statuss;
	
	                       at.get_activity_status(statuss);
	                       auto rows = statuss.size();
	                       block.repeat(rows);
	                       int i = 0;
	                       for(const auto &v : statuss){
	                               block[i].set("activity_status_value", v);
	                               block[i].set("activity_status_show", v);
					++i;
	                       }
	               }
	               {
			       activity_priority at;
	                       Block & block = t.block( "meat" )[ 0 ].block( "priorityblock" );
	                       std::vector<string> prioritys;
	
	                       at.get_activity_priority(prioritys);
	                       auto rows = prioritys.size();
	                       block.repeat(rows);
	                       int i = 0;
	                       for(const auto &v : prioritys){
	                               block[i].set("activity_priority_value", v);
	                               block[i].set("activity_priority_show", v);
					++i;
	                       }
	               }
	               {
				//this comes from users(operational employee)
			       user_table ut;
	                       Block & block = t.block( "meat" )[ 0 ].block( "presiderblock" );
	                       std::map<string, string> presiders;
	
	                       ut.get_user_list(presiders);
	                       auto rows = presiders.size();
	                       block.repeat(rows);
	                       int i = 0;
	                       for(const auto &v : presiders){
	                               block[i].set("activity_presider_value", v.first);
	                               block[i].set("activity_presider_show", v.second);
					++i;
	                       }
	               }
#endif



		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
