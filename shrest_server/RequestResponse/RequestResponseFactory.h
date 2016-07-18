#pragma once

#include "RequestResponse.h"

class RequestResponseFactory{

public:
	static unique_ptr<RequestResponse> CreateProcessor(string name, HttpServer::Response &rs, ShRequest rq);
};
