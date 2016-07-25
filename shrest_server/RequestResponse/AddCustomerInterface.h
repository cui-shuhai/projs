
#pragma once

#include "RequestResponse.h"

class AddCustomerInterface : public RequestResponse{
public:
	AddCustomerInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
