
#pragma once

#include "RequestResponse.h"

class SearchCustomerRequest : public RequestResponse{
public:
	SearchCustomerRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
