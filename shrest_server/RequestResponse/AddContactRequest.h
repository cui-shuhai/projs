
#pragma once

#include "RequestResponse.h"

class AddContactRequest : public RequestResponse{
public:
	AddContactRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
