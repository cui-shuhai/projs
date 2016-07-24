
#pragma once

#include "RequestResponse.h"

class ListContactRequest : public RequestResponse{
public:
	ListContactRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
