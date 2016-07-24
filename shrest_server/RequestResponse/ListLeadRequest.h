
#pragma once

#include "RequestResponse.h"

class ListLeadRequest : public RequestResponse{
public:
	ListLeadRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
