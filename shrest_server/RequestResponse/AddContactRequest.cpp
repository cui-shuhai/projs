
#include <string>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "contact_table.h"
#include "AddContactRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddContactRequest::AddContactRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){}


void AddContactRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);


		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		contact_table ct( utils::create_uuid(), m["status"], m["first_name"], m["last_name"], m["contact_from"], m["address"], m["primary_phone"], m["alt_phone"], m["mobile_phone"], m["fax"], m["email"], m["twitter"], m["linkedin"], m["facebook"], m["job_title"], m["company_id"], m["when_met"], m["where_met"], m["time_zone"], m["main_contact"], m["out_of_marketing"], m["out_of_billing"], m["extra_info"] );
		if( true) //!ct.check_contact_exist())
		{
			ct.add_contact_table();

			t.load( "web/addcontactresponse.html" );
		}
		else
		{
			t.load( "web/addcontactwarning.html" );
		}

		//t.block("meat").repeat(1);
		//t.block("meat")[0].set("login_name",m["login_name"]);


		stringstream cs;
		t.render( cs ); 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
