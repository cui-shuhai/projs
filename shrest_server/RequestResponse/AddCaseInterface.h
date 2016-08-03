
#pragma once

#include "RequestResponse.h"

class AddCaseInterface : public RequestResponse{
public:
	AddCaseInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
