
#pragma once

#include "RequestResponse.h"

class AddVendorInterface : public RequestResponse{
public:
	AddVendorInterface(HttpServer::Response &rs, ShRequest rq);
	void ProcessGet() override;
	void ProcessPost() override;
}; 
