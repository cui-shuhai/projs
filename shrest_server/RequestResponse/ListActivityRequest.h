
#pragma once

#include "RequestResponse.h"

class ListActivityRequest : public RequestResponse{
public:
	ListActivityRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
