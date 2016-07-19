
#pragma once

#include "RequestResponse.h"

class SearchCustomerInterface : public RequestResponse{
public:
	SearchCustomerInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
