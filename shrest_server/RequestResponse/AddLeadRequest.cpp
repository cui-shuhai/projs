


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "lead_table.h"
#include "contact_table.h"
#include "AddLeadRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


AddLeadRequest::AddLeadRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void AddLeadRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);
		string id = utils::create_uuid();
		lead_table c( id, m["company_name"], m["contact_name"], m["personal_title"], 
				m["first_name"], m["last_name"], m["phone"], m["email"], 
				m["street_addr"], m["city"], m["state"], m["post_code"], 
				m["country"], m["bill_addr"], m["ship_addr"], 
				m["lead_source"], m["lead_status"], m["lead_rating"]);

		c.add_lead_table();

		contact_table ct; 
		ct.set_contact_id(utils::create_uuid());
		ct.set_contact_from("lead");
		ct.set_first_name(m["first_name"]);
		ct.set_last_name(m["last_name"]);
		ct.set_company_id(id);

		ct.add_contact_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "new lead added" << endl;
		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
