
#pragma once

#include "RequestResponse.h"

class NewCustomerPost : public RequestResponse{
public:
	NewCustomerPost(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
