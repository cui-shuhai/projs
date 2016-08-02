
#pragma once

#include "RequestResponse.h"

class AddActivityInterface : public RequestResponse{
public:
	AddActivityInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
	//void Process() override;
}; 
