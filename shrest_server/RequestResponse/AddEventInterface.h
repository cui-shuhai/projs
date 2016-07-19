
#pragma once

#include "RequestResponse.h"

class AddEventInterface : public RequestResponse{
public:
	AddEventInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
