
#pragma once

#include "RequestResponse.h"

class EditLeadRequest : public RequestResponse{
public:
	EditLeadRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
