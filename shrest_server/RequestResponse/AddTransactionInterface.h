
#pragma once

#include "RequestResponse.h"

class AddTransactionInterface : public RequestResponse{
public:
	AddTransactionInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
