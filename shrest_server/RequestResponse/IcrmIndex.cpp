

#include <iostream>
#include <fstream>
#include <map>
#include <string>
#include <boost/regex.hpp>
#include <boost/filesystem.hpp>


#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate.h"
#include "cookie_table.h"
#include "IcrmIndex.h"



using namespace std;
using namespace NL::Template;


IcrmIndex::IcrmIndex(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
IcrmIndex::~IcrmIndex(){}

void IcrmIndex::Process(){
	LOG(rq_->method, rq_->path);
     try {

		auto content=rq_->content.string();
		auto cookies = rq_->cookies;
		
		if(!cookies.empty()){
			string key;
			if(GetSession(key)){
				cookie_table ct;
				string user{};
				string password{};
				ct.get_cookie_user(key, user, password);
				CreateDashboard(user, password);
				LOG("find key for user", user);
				return;
			}
			else{
				LOG("cookie corrupted\n");
				rs_ << "cookie corrupted, please clear cookie and relogin\n";
				rs_.flush();
				return;	
			}	   	
		}
		
		
		stringstream content_stream;
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/login.html" );        

		t.render( content_stream ); // Render the template with the variables we've set above
 
		//find length of content_stream (length received using content_stream.tellp())
		content_stream.seekp(0, ios::end);

		rs_ <<  content_stream.rdbuf();
		rs_.flush();
    }
    catch(exception& e) {
        rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
    }
}
