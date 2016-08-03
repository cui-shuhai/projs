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

     //AddCustomerInterface to test Template
     server.resource["^/customer$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCustomerInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addcustomer, GET] API");
     //customer post
     server.resource["^/customer$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCustomerInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [customer, POST] API");

     //AddVendorInterface to test Template
     server.resource["^/addvendor$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddVendorInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addvendorinterface, GET] API");

     //AddLeadInterface to test Template
     server.resource["^/lead$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddLeadInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addleadinterface, GET] API");
     //AddLeadRequest to test Template
     server.resource["^/lead$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddLeadInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addleadrequest, POST] API");


     //AddContactInterface to test Template
     server.resource["^/contact$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddContactInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addcontact, GET] API");

     //AddContactRequest to test Template
     server.resource["^/addcontact$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddContactRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [addcontact, POST] API");

     //AddLeadContactInterface to test Template
     server.resource["^/addleadcontact$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddLeadContactInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addleadcontact, GET] API");

	
    //AddCustomerInterface to test Template
     server.resource["^/user$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddUserInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [adduser, GET] API");

    //AddCustomerRequest to connecting to mysql
     server.resource["^/adduserrequest$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddUserRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [adduserrequest, POST] API");

 	//Add listcase
     server.resource["^/listuser$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("ListUserRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [listuserrequest, GET] API");
    //-----------
     server.resource["^/uploaddocument$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("UploadDocumentInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [adduser, GET] API");
    //-------------
     server.resource["^/uploaddocumentrequest$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("UploadDocumentRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [uploaddocumentrequest, POST] API");
	
    //AddCustomerInterface to test Template
     server.resource["^/employee$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddEmployeeInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addemployee, GET] API");

    //AddCustomerRequest to connecting to mysql
     server.resource["^/employee$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddEmployeeInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addemployeerequest, POST] API");


     server.resource["^/searchcustomer$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("SearchCustomerInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [searchcustomer, GET] API");

     //Search customers request
     server.resource["^/searchcustomerrequest$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("SearchCustomerRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [searchcustomerrequest, POST] API");


     //server.resource["^/addactivity$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {
     server.resource["^/activity$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddActivityInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addactivity, GET] API");

     //Add customer activity request
     server.resource["^/activity$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	//auto processor = RequestResponseFactory::CreateProcessor("AddActivityRequest", response, request);	
	auto processor = RequestResponseFactory::CreateProcessor("AddActivityInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addactivityrequest, POST] API");

 	//listcontact 
     server.resource["^/listcontact.*$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("ListContactRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [ListContactrequest, GET] API");

 	//listopportunity 
     server.resource["^/opportunity$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddOpportunityInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [ListOpportunityrequest, GET] API");

     server.resource["^/opportunity$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddOpportunityInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [ListOpportunityrequest, GET] API");


     //Add transaction interface
     server.resource["^/transaction$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddTransactionInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addtransaction, GET] API");

  	//Add transaction request
     server.resource["^/addtransactionrequest$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddTransactionRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [addtransactionrequest, POST] API");

     //Add transaction interface
     server.resource["^/task$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddTaskInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [addtask, GET] API");

 	//Add transaction request
     server.resource["^/addtaskrequest$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddTaskRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [addtaskrequest, POST] API");

 	//Add transaction request
     server.resource["^/listtask$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("ListTaskRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [ListTaskrequest, POST] API");

 	//Add listampaignrequest request
     server.resource["^/campaign$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCampaignInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [listcampaignrequest, GET] API");
 	//Add listcampaignrequest request
     server.resource["^/campaign$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCampaignInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [listcampaignrequest, GET] API");

     server.resource["^/cases$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCaseInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [listcaserequest, GET] API");

     server.resource["^/cases$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("AddCaseInterface", response, request);	
	processor->Process();        
    };
	LOG("Adding [caserequest, POST] API");

	//Add login request
     server.resource["^/loginrequest$"]["POST"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("LoginRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding [listloginrequest, POST] API");

	//Add logout request
     server.resource["^/logout$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("LogoutRequest", response, request);	
	processor->Process();        
    };
	LOG("Adding Logout  GET] API");


     //Search Contact activities
     server.resource["^/activity/[0-9]+$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("SearchContactActivity", response, request);	
	processor->Process();        
    };
	LOG("Adding [activity[0-9]+, GET] API");

      //pieget to test java script
     server.resource["^/pie$"]["GET"]=[](HttpServer::Response& response, ShRequest request) {

	auto processor = RequestResponseFactory::CreateProcessor("PieGet", response, request);	
	processor->Process();        
    };

	LOG("Adding [pie, GET] API");
    
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
	LOG("Adding [info, GET] API");
    
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
	
	auto processor = RequestResponseFactory::CreateProcessor("IcrmIndex", response, request);	
	processor->Process();
    };
	LOG("Adding home index [GET] API");
    
    thread server_thread([&server](){
        //Start server
        server.start();
    });
    
    //Wait for server to start so that the client can connect
    this_thread::sleep_for(chrono::seconds(1));
    
    server_thread.join();
    
    return 0;
}
