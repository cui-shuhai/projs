
#pragma once

#include "RequestResponse.h"

class AddEmployeeRequest : public RequestResponse{
public:
	AddEmployeeRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
