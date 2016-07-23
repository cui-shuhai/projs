


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

#include "vendor_table.h"
#include "AddVendorInterface.h"

using namespace sqlite;
using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddVendorInterface::AddVendorInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

/*parse customer information and put into database*/
void AddVendorInterface::Process(){
	LOG(rq_->method, rq_->path);
	
	try {		
		stringstream cs;
				
		LoaderFile loader; // Let's use the default loader that loads files from disk.
		Template t( loader );
		t.load( "web/addsupplierinterface.html" );
		t.block("meat").repeat(1); 
		

		//profile
		if(true){
			vendor_table pt;
			std::map<int, string> ratings;
			pt.get_vendor_rating(ratings);
			auto rows = ratings.size();

			Block & block = t.block( "meat" )[ 0 ].block( "credit_rating_block" );
			if(rows > 0)
				block.repeat(rows);
			int i = 0;
			for(const auto & v : ratings){
				block[i].set("credit_rating_value", to_string(v.first));
				block[i].set("credit_rating_show", v.second);
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
}
