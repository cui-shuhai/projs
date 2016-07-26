
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include "JsonPostRequest.h"


#define BOOST_SPIRIT_THREADSAFE

using namespace std;
using namespace boost::property_tree;

JsonPostRequest::JsonPostRequest(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

void JsonPostRequest::Process(){
     try {
            ptree pt;
            read_json(rq_->content, pt);

            string name=pt.get<string>("first_name")+" "+pt.get<string>("last_name");

            rs_ << "HTTP/1.1 200 OK\r\nContent-Length: " << name.length() << "\r\n\r\n" << name;
	rs_.flush();
        }
        catch(exception& e) {
            rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
        }
}
