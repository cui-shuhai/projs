
#pragma once

#include "RequestResponse.h"

class SearchContactActivity : public RequestResponse{
public:
	SearchContactActivity(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
