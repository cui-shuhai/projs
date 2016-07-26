
#pragma once

#include "RequestResponse.h"

class AddContactInterface : public RequestResponse{
public:
	AddContactInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
