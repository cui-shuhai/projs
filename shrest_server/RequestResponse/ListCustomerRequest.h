
#pragma once

#include "RequestResponse.h"

class ListCustomerRequest : public RequestResponse{
public:
	ListCustomerRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
