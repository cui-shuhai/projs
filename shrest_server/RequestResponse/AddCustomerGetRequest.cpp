


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "AddCustomerGetRequest.h"

using namespace std;
using namespace boost::property_tree;
AddCustomerGetRequest::AddCustomerGetRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

void AddCustomerGetRequest::Process(){
     try {
           
        stringstream content_stream;
        content_stream << R"XXX(
<!DOCTYPE HTML>
<html>
<head>hello
</head>
<body>
  form....
</body>
</html>

)XXX";
        
        //find length of content_stream (length received using content_stream.tellp())
        content_stream.seekp(0, ios::end);
        
        rs_ <<  content_stream.rdbuf();
	rs_.flush();
    }
    catch(exception& e) {
        rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
    }
}
