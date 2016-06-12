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

	virtual void Process() = 0;


protected:
	HttpServer::Response &rs_;
	ShRequest rq_;
};