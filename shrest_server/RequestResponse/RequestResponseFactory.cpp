

#include "JsonPostRequest.h"
#include "PieGetRequest.h"
#include "AddCustomerGetRequest.h"
#include "NewCustomerPost.h"
#include "ListCustomersGet.h"
#include "IcrmIndex.h"
#include "AddActivityInterface.h"
#include "AddActivityRequest.h"
#include "SearchCustomerInterface.h"
#include "SearchCustomerRequest.h"
#include "AddTransactionInterface.h"
#include "AddTransactionRequest.h"
#include "AddTaskInterface.h"
#include "AddTaskRequest.h"
#include "AddUserInterface.h"
#include "AddUserRequest.h"
#include "AddEmployeeInterface.h"
#include "AddEmployeeRequest.h"
#include "ListTaskRequest.h"
#include "ListCampaignRequest.h"
#include "ListActivityRequest.h"
#include "ListOpportunityRequest.h"
#include "LoginRequest.h"
#include "LogoutRequest.h"
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
	if(name == "AddActivityInterface")
		return unique_ptr<AddActivityInterface>( new AddActivityInterface(rs, rq));
	if(name == "AddActivityRequest")
		return unique_ptr<AddActivityRequest>( new AddActivityRequest(rs, rq));
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
	if(name == "AddUserInterface")
		return unique_ptr<AddUserInterface>( new AddUserInterface(rs, rq));	
	if(name == "AddUserRequest")
		return unique_ptr<AddUserRequest>( new AddUserRequest(rs, rq));	
	if(name == "AddEmployeeInterface")
		return unique_ptr<AddEmployeeInterface>( new AddEmployeeInterface(rs, rq));	
	if(name == "AddEmployeeRequest")
		return unique_ptr<AddEmployeeRequest>( new AddEmployeeRequest(rs, rq));	
	if(name == "ListTaskRequest")
		return unique_ptr<ListTaskRequest>( new ListTaskRequest(rs, rq));	
	if(name == "ListCampaignRequest")
		return unique_ptr<ListCampaignRequest>( new ListCampaignRequest(rs, rq));	
	if(name == "ListActivityRequest")
		return unique_ptr<ListActivityRequest>( new ListActivityRequest(rs, rq));	
	if(name == "ListOpportunityRequest")
		return unique_ptr<ListOpportunityRequest>( new ListOpportunityRequest(rs, rq));	
	if(name == "LoginRequest")
		return unique_ptr<LoginRequest>( new LoginRequest(rs, rq));	
	if(name == "LogoutRequest")
		return unique_ptr<LogoutRequest>( new LogoutRequest(rs, rq));	
	
	return nullptr;
}
