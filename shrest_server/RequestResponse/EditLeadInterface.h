
#pragma once

#include "RequestResponse.h"

class EditLeadInterface : public RequestResponse{
public:
	EditLeadInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
