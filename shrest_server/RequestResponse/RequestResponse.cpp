
#include "RequestResponse.h"


RequestResponse::RequestResponse(HttpServer::Response &rs, ShRequest rq):
		rs_(rs), rq_(rq){}

RequestResponse::~RequestResponse(){}
