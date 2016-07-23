
#pragma once

#include "RequestResponse.h"

class ListCaseRequest : public RequestResponse{
public:
	ListCaseRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
