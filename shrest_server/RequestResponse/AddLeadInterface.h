
#pragma once

#include "RequestResponse.h"

class AddLeadInterface : public RequestResponse{
public:
	AddLeadInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
