
#pragma once

#include "RequestResponse.h"

class EditActivityRequest : public RequestResponse{
public:
	EditActivityRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
