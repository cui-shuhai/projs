
#pragma once

#include "RequestResponse.h"

class AddCustomerRequest : public RequestResponse{
public:
	AddCustomerRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
