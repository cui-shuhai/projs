
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

#include "user_table.h"
#include "UploadDocumentRequest.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;


UploadDocumentRequest::UploadDocumentRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
  

void UploadDocumentRequest::Process(){
	LOG(rq_->method, rq_->path);

	try {
		stringstream cs;
		auto content=rq_->content.string();

		cs << content <<  endl;

		cs << "content length: " << content.length() << endl;

		std::map<std::string, std::string> m;
		utils::parse_kye_value(content, m);

		
		cs << "params: " << m.size() << endl;
		for(const auto & v : m ){
			cout << v.first << endl;
		}


		auto name = m["file_name"];

		cs << "name" << m["filefield"]  << endl;

		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		cs.seekp(0, ios::end);
			rs_ <<  cs.rdbuf();
		rs_.flush();
		
	}
	catch(exception& e) {
		rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
	}
}
