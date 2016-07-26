
#pragma once

#include "RequestResponse.h"

class EditCustomerInterface : public RequestResponse{
public:
	EditCustomerInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
