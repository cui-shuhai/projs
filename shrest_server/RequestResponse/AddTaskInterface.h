
#pragma once

#include "RequestResponse.h"

class AddTaskInterface : public RequestResponse{
public:
	AddTaskInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
