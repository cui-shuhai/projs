
#pragma once

#include "RequestResponse.h"

class LoginRequest : public RequestResponse{
public:
	LoginRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
