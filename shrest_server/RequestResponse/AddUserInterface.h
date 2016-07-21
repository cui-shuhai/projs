
#pragma once

#include "RequestResponse.h"

class AddUserInterface : public RequestResponse{
public:
	AddUserInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
