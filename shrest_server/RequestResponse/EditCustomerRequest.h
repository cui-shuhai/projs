
#pragma once

#include "RequestResponse.h"

class EditCustomerRequest : public RequestResponse{
public:
	EditCustomerRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
