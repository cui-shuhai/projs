
#pragma once

#include "RequestResponse.h"

class ListCompaignRequest : public RequestResponse{
public:
	ListCompaignRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
