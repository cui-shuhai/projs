
#pragma once

#include "RequestResponse.h"

class AddSupplierInterface : public RequestResponse{
public:
	AddSupplierInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
