#pragma once

#include "RequestResponse.h"
#include "JsonPostRequest.h"
#include "PieGetRequest.h"
#include "AddCustomerGetRequest.h"
#include "NewCustomerPost.h"

class RequestResponseFactory{

public:
	static unique_ptr<RequestResponse> CreateProcessor(string name, HttpServer::Response &rs, ShRequest rq){
		if(name == "JsonPost")
			return unique_ptr<JsonPostRequest>( new JsonPostRequest(rs, rq));
		if(name == "PieGet")
			return unique_ptr<PieGetRequest>( new PieGetRequest(rs, rq));
		if(name == "AddCustomerGet")
			return unique_ptr<AddCustomerGetRequest>( new AddCustomerGetRequest(rs, rq));
		if(name == "NewCustomerPost")
			return unique_ptr<NewCustomerPost>( new NewCustomerPost(rs, rq));
		
		return nullptr;
	}
};
