
#pragma once

#include "RequestResponse.h"

class AddCustomerGetRequest : public RequestResponse{
public:
	AddCustomerGetRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
