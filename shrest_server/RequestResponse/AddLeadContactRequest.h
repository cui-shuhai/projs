
#pragma once

#include "RequestResponse.h"

class AddLeadContactRequest : public RequestResponse{
public:
	AddLeadContactRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
