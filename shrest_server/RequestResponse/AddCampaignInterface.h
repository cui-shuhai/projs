
#pragma once

#include "RequestResponse.h"

class AddCampaignInterface : public RequestResponse{
public:
	AddCampaignInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
