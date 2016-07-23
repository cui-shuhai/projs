
#pragma once

#include "RequestResponse.h"

class AddLeadRequest : public RequestResponse{
public:
	AddLeadRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
