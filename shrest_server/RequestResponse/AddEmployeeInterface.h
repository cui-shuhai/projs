
#pragma once

#include "RequestResponse.h"

class AddEmployeeInterface : public RequestResponse{
public:
	AddEmployeeInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
