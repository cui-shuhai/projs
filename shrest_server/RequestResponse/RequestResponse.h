#pragma once

#include <memory>

#include "server_http.hpp"

/*
Patent: customer auto identification and relation co-manage 
*/
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
	string GetUserId();
	void GetUser(string &uid, string& name);

	virtual void Process();;
	virtual void ProcessGet() {};
	virtual void ProcessPost() {};
	virtual void ProcessPut() {};
	virtual void ProcessDelete() {};


protected:
	HttpServer::Response &rs_;
	ShRequest rq_;
};
