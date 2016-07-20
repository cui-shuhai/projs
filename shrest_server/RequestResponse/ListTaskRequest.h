
#pragma once

#include "RequestResponse.h"

class ListTaskRequest : public RequestResponse{
public:
	ListTaskRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
