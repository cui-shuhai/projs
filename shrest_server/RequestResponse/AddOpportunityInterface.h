
#pragma once

#include "RequestResponse.h"

class AddOpportunityInterface : public RequestResponse{
public:
	AddOpportunityInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
