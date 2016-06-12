#pragma once

#include "RequestResponse.h"
#include "JsonPostRequest.h"

class RequestResponseFactory{

public:
	static unique_ptr<RequestResponse> CreateProcessor(string name, HttpServer::Response &rs, ShRequest rq){
		if(name == "JsonPost")
			return unique_ptr<JsonPostRequest>( new JsonPostRequest(rs, rq));
		
		return nullptr;
	}
};
