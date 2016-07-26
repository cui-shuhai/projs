


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
#include "EditActivityRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


EditActivityRequest::EditActivityRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
/*parse customer information and put into database*/

void EditActivityRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {

		auto content=rq_->content.string();
		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);
		activity_table c( stoi(m["activity_id"]), m["activity_name"], 
 stoi( m["activity_type"] ), stoi( m["activity_status"] ), stoi( m["activity_priority"] ), stoi( m["who_preside"] ), utils::get_date(), m["note"]);
				//stoi(m["activity_source"]), stoi(m["activity_status"]), stoi(m["activity_rating"]));

		c.update_table();

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		stringstream cs;

		cs << "activity saved" << endl;
		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
};
