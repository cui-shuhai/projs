
#pragma once

#include "RequestResponse.h"

class AddActivityInterface : public RequestResponse{
public:
	AddActivityInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
