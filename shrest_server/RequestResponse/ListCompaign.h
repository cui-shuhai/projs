
#pragma once

#include "RequestResponse.h"

class ListCompaign : public RequestResponse{
public:
	ListCompaign(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
