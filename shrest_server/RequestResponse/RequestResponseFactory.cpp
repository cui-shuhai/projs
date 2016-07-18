

#include "JsonPostRequest.h"
#include "PieGetRequest.h"
#include "AddCustomerGetRequest.h"
#include "NewCustomerPost.h"
#include "ListCustomersGet.h"
#include "IcrmIndex.h"
#include "RequestResponseFactory.h"

unique_ptr<RequestResponse> RequestResponseFactory::CreateProcessor(string name, HttpServer::Response &rs, ShRequest rq){
	if(name == "JsonPost")
		return unique_ptr<JsonPostRequest>( new JsonPostRequest(rs, rq));
	if(name == "PieGet")
		return unique_ptr<PieGetRequest>( new PieGetRequest(rs, rq));
	if(name == "AddCustomerGet")
		return unique_ptr<AddCustomerGetRequest>( new AddCustomerGetRequest(rs, rq));
	if(name == "NewCustomerPost")
		return unique_ptr<NewCustomerPost>( new NewCustomerPost(rs, rq));
	if(name == "ListCustomersGet")
		return unique_ptr<ListCustomersGet>( new ListCustomersGet(rs, rq));
	if(name == "IcrmIndex")
		return unique_ptr<IcrmIndex>( new IcrmIndex(rs, rq));
	
	return nullptr;
	}
