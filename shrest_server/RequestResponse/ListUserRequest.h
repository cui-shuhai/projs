
#pragma once

#include "RequestResponse.h"

class ListUserRequest : public RequestResponse{
public:
	ListUserRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
