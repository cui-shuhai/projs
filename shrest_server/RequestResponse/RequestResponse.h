#pragma once

#include <memory>

#include "server_http.hpp"

using namespace std;

class SimpleWeb::Server<SimpleWeb::HTTP>;

using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
using ShRequest = shared_ptr<HttpServer::Request>;

class RequestResponse{
public:
	RequestResponse(HttpServer::Response &rs, ShRequest rq);
	~RequestResponse();
	
	void CreateDashboard(const string & username, const string password);
	bool GetSession(std::string& session);

	virtual void Process() = 0;


protected:
	HttpServer::Response &rs_;
	//rq_: path contains the whole path information. like /customers/john
	//XXX we can hook  ^/customers$ to function to get all customers $/customers/.\+/$ to get specific customers
	ShRequest rq_;
};
