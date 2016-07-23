
#pragma once

#include "RequestResponse.h"

class UploadDocumentInterface : public RequestResponse{
public:
	UploadDocumentInterface(HttpServer::Response &rs, ShRequest rq);
	void Process() override;
}; 
