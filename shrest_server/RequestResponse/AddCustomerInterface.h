
#pragma once

#include "RequestResponse.h"

class AddCustomerInterface : public RequestResponse{
public:
	AddCustomerInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
