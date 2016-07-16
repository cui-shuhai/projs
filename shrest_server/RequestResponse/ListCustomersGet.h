
#pragma once

#include "RequestResponse.h"

class ListCustomersGet : public RequestResponse{
public:
	ListCustomersGet(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
