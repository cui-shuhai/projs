#include "server_http.hpp"
#include "client_http.hpp"

//Added for the json-example
#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

//Added for the default_resource example
#include <iostream>
#include <fstream>
#include <boost/filesystem.hpp>
#include <vector>
#include <algorithm>

#include "shrest_log.h"
#include "RequestResponseFactory.h"

using namespace std;
//Added for the json-example:
using namespace boost::property_tree;

using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
using HttpClient = SimpleWeb::Client<SimpleWeb::HTTP>;
using ShRequest = shared_ptr<HttpServer::Request>;



int main() {
    //HTTP-server at port 8080 using 4 threads
    HttpServer server(8080, 4);
    
    LOG("server listening on ", 8080, "thread pool : ", 4);

    //Add resources using path-regex and method-string, and an anonymous function
    //POST-example for the path /string, responds the posted string	
    server.resource["^/string$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {
        //Retrieve string:
        auto content=request->content.string();
        //request->content.string() is a convenience function for:
        //stringstream ss;
        //ss << request->content.rdbuf();
        //string content=ss.str();
        
        response << "HTTP/1.1 200 OK\r\nContent-Length: " << content.length() << "\r\n\r\n" << content;
    };
	LOG("Adding [string, POST] API");
    
    //POST-example for the path /json, responds firstName+" "+lastName from the posted json
    //Responds with an appropriate error message if the posted json is not valid, or if firstName or lastName is missing
    //Example posted json:
    //{
    //  "firstName": "John",
    //  "lastName": "Smith",
    //  "age": 25
    //}
    server.resource["^/json$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("JsonPost", response, request);	
	processor->Process();        
    };
	LOG("Adding [json$ POST] API");

     //AddCustomerGet to test Template
     server.resource["^/addcustomer$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCustomerGet", response, request);	
	processor->Process();        
    };
	LOG("Adding [addcustomer, GET] API");

    //NewCustomerPost to connecting to mysql
     server.resource["^/newcustomer$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("NewCustomerPost", response, request);	
	processor->Process();        
    };
	LOG("Adding [newcustomer, POST] API");
	
      //List all customers
     server.resource["^/listcustomer$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("ListCustomerGet", response, request);	
	processor->Process();        
    };
	LOG("Adding [listcustomer, GET] API");
	
      //pieget to test java script
     server.resource["^/pie$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("PieGet", response, request);	
	processor->Process();        
    };
    
    //GET-example for the path /info
    //Responds with request-information
    server.resource["^/info$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {
        stringstream content_stream;
        content_stream << "<h1>Request from " << request->remote_endpoint_address << " (" << request->remote_endpoint_port << ")</h1>";
        content_stream << request->method << " " << request->path << " HTTP/" << request->http_version << "<br>";
        for(auto& header: request->header) {
            content_stream << header.first << ": " << header.second << "<br>";
        }
        
        //find length of content_stream (length received using content_stream.tellp())
        content_stream.seekp(0, ios::end);
        
        response <<  "HTTP/1.1 200 OK\r\nContent-Length: " << content_stream.tellp() << "\r\n\r\n" << content_stream.rdbuf();
    };
    
    //GET-example for the path /match/[number], responds with the matched string in path (number)
    //For instance a request GET /match/123 will receive: 123
    server.resource["^/match/([0-9]+)$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {
        string number=request->path_match[1];
        response << "HTTP/1.1 200 OK\r\nContent-Length: " << number.length() << "\r\n\r\n" << number;
    };
    
    //Default GET-example. If no other matches, this anonymous function will be called. 
    //Will respond with content in the web/-directory, and its subdirectories.
    //Default file: index.html
    //Can for instance be used to retrieve an HTML 5 client that uses REST-resources on this server
    server.default_resource["GET"]=[](HttpServer::Response& response, ShRequest request) {
        const auto web_root_path=boost::filesystem::canonical("web");
        boost::filesystem::path path=web_root_path;
        path/=request->path;
        if(boost::filesystem::exists(path)) {
            path=boost::filesystem::canonical(path);
            //Check if path is within web_root_path
            if(distance(web_root_path.begin(), web_root_path.end())<=distance(path.begin(), path.end()) &&
               equal(web_root_path.begin(), web_root_path.end(), path.begin())) {
                if(boost::filesystem::is_directory(path))
                    path/="index.html";
                if(boost::filesystem::exists(path) && boost::filesystem::is_regular_file(path)) {
                    ifstream ifs;
                    ifs.open(path.string(), ifstream::in | ios::binary);
                    
                    if(ifs) {
                        ifs.seekg(0, ios::end);
                        auto length=ifs.tellg();
                        
                        ifs.seekg(0, ios::beg);
                        
                        response << "HTTP/1.1 200 OK\r\nContent-Length: " << length << "\r\n\r\n";
                        
                        //read and send 128 KB at a time
                        const size_t buffer_size=131072;
                        vector<char> buffer(buffer_size);
                        streamsize read_length;
                        try {
                            while((read_length=ifs.read(&buffer[0], buffer_size).gcount())>0) {
                                response.write(&buffer[0], read_length);
                                response.flush();
                            }
                        }
                        catch(const exception &) {
                            cerr << "Connection interrupted, closing file" << endl;
                        }

                        ifs.close();
                        return;
                    }
                }
            }
        }
        string content="Could not open path "+request->path;
        response << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << content.length() << "\r\n\r\n" << content;
    };
    
    thread server_thread([&server](){
        //Start server
        server.start();
    });
    
    //Wait for server to start so that the client can connect
    this_thread::sleep_for(chrono::seconds(1));
    
    server_thread.join();
    
    return 0;
}
