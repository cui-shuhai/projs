
#pragma once

#include "RequestResponse.h"

class PieGetRequest : public RequestResponse{
public:
	PieGetRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
