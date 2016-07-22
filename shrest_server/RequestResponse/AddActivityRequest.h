
#pragma once

#include "RequestResponse.h"

class AddActivityRequest : public RequestResponse{
public:
	AddActivityRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
