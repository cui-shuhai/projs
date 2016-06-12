#pragma once

#include "RequestResponse.h"

class JsonPostRequest : public RequestResponse{
public:
	JsonPostRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
