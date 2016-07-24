


#define BOOST_SPIRIT_THREADSAFE
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>

#include "shrest_log.h"
#include "shrest_utils.h"
#include "NLTemplate/NLTemplate.h"

#include "employee_table.h"
#include "employee_profile.h"
#include "employee_role.h"
#include "UploadDocumentInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


UploadDocumentInterface::UploadDocumentInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

/*parse customer information and put into database*/
void UploadDocumentInterface::Process(){
	LOG(rq_->method, rq_->path);
	
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/uploaddocumentinterface.html" );
		t.block("meat").repeat(1); 
		

		t.render( cs ); // Render the template with the variables we've set above
 
		
		cs.seekp(0, ios::end);
		rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
