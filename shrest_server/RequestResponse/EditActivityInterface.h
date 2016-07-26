
#pragma once

#include "RequestResponse.h"

class EditActivityInterface : public RequestResponse{
public:
	EditActivityInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
