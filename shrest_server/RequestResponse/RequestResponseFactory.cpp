

#include "JsonPostRequest.h"
#include "PieGetRequest.h"
#include "AddCustomerGetRequest.h"
#include "NewCustomerPost.h"
#include "ListCustomersGet.h"
#include "IcrmIndex.h"
#include "AddEventInterface.h"
#include "AddEventRequest.h"
#include "SearchCustomerInterface.h"
#include "SearchCustomerRequest.h"
#include "AddTransactionInterface.h"
#include "AddTransactionRequest.h"
#include "AddTaskInterface.h"
#include "AddTaskRequest.h"
#include "ListTaskRequest.h"
#include "SearchContactActivity.h"
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
	if(name == "SearchCustomerInterface")
		return unique_ptr<SearchCustomerInterface>( new SearchCustomerInterface(rs, rq));
	if(name == "SearchCustomerRequest")
		return unique_ptr<SearchCustomerRequest>( new SearchCustomerRequest(rs, rq));
	if(name == "AddEventInterface")
		return unique_ptr<AddEventInterface>( new AddEventInterface(rs, rq));
	if(name == "AddEventRequest")
		return unique_ptr<AddEventRequest>( new AddEventRequest(rs, rq));
	if(name == "AddTransactionInterface")
		return unique_ptr<AddTransactionInterface>( new AddTransactionInterface(rs, rq));
	if(name == "AddTransactionRequest")
		return unique_ptr<AddTransactionRequest>( new AddTransactionRequest(rs, rq));
	if(name == "SearchContactActivity")
		return unique_ptr<SearchContactActivity>( new SearchContactActivity(rs, rq));	
	if(name == "AddTaskInterface")
		return unique_ptr<AddTaskInterface>( new AddTaskInterface(rs, rq));	
	if(name == "AddTaskRequest")
		return unique_ptr<AddTaskRequest>( new AddTaskRequest(rs, rq));	
	if(name == "ListTaskRequest")
		return unique_ptr<ListTaskRequest>( new ListTaskRequest(rs, rq));
	
	return nullptr;
	}
