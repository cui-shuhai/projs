
#pragma once

#include "RequestResponse.h"

class AddOrderInterface : public RequestResponse{
public:
	AddOrderInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
