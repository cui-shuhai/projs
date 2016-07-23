
#pragma once

#include "RequestResponse.h"

class ListCampaignRequest : public RequestResponse{
public:
	ListCampaignRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
