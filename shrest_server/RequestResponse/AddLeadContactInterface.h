
#pragma once

#include "RequestResponse.h"

class AddLeadContactInterface : public RequestResponse{
public:
	AddLeadContactInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
