
#pragma once

#include "RequestResponse.h"

class AddTransactionRequest : public RequestResponse{
public:
	AddTransactionRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
