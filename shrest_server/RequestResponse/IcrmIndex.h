#pragma once

#include "RequestResponse.h"

class IcrmIndex : public RequestResponse{
public:
	IcrmIndex(HttpServer::Response &rs, ShRequest rq);
	~IcrmIndex();
	void Process() override;
}; 
