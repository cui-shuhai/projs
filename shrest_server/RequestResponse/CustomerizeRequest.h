
#pragma once

#include "RequestResponse.h"

class CustomerizeRequest : public RequestResponse{
public:
	CustomerizeRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
