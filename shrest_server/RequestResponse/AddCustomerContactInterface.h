
#pragma once

#include "RequestResponse.h"

class AddCustomerContactInterface : public RequestResponse{
public:
	AddCustomerContactInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
