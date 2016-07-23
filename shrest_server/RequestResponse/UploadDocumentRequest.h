
#pragma once

#include "RequestResponse.h"

class UploadDocumentRequest : public RequestResponse{
public:
	UploadDocumentRequest(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
