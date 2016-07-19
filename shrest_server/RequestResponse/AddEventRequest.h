
#pragma once

#include "RequestResponse.h"

class AddEventRequest : public RequestResponse{
public:
	AddEventRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
