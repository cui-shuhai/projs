
#pragma once

#include "RequestResponse.h"

class ListEmployeeRequest : public RequestResponse{
public:
	ListEmployeeRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
