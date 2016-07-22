
#pragma once

#include "RequestResponse.h"

class ListOpportunityRequest : public RequestResponse{
public:
	ListOpportunityRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
