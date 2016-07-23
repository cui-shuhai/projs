
#pragma once

#include "RequestResponse.h"

class LogoutRequest : public RequestResponse{
public:
	LogoutRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
