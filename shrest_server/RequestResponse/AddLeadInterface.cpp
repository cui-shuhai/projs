


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "NLTemplate/NLTemplate.h"
#include "lead_table.h"
#include "AddLeadInterface.h"

using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddLeadInterface::AddLeadInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

void AddLeadInterface::Process(){
	LOG(rq_->method, rq_->path);
     try {

        	stringstream content_stream;
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addleadinterface.html" );

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
