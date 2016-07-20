
#pragma once

#include "RequestResponse.h"

class AddTaskRequest : public RequestResponse{
public:
	AddTaskRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
