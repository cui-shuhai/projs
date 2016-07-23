
#pragma once

#include "RequestResponse.h"

class AddUserRequest : public RequestResponse{
public:
	AddUserRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
