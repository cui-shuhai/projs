

#include "JsonPostRequest.h"
#include "PieGetRequest.h"
#include "AddCustomerInterface.h"
#include "AddVendorInterface.h"
#include "AddLeadInterface.h"
#include "AddContactInterface.h"
#include "IcrmIndex.h"
#include "AddActivityInterface.h"
#include "SearchCustomerInterface.h"
#include "SearchCustomerRequest.h"
#include "AddTransactionInterface.h"
#include "AddTransactionRequest.h"
#include "AddTaskInterface.h"
#include "AddOrderInterface.h"
#include "AddCaseInterface.h"
#include "AddUserInterface.h"
#include "AddVendorInterface.h"
#include "CustomerizeRequest.h"
#include "UploadDocumentInterface.h"
#include "UploadDocumentRequest.h"
#include "AddEmployeeInterface.h"
#include "AddCampaignInterface.h"
#include "AddOpportunityInterface.h"
#include "LoginRequest.h"
#include "LogoutRequest.h"
#include "SearchContactActivity.h"
#include "RequestResponseFactory.h"

unique_ptr<RequestResponse> RequestResponseFactory::CreateProcessor(string name, HttpServer::Response &rs, ShRequest rq){
	if(name == "JsonPost")
		return unique_ptr<JsonPostRequest>( new JsonPostRequest(rs, rq));
	if(name == "PieGet")
		return unique_ptr<PieGetRequest>( new PieGetRequest(rs, rq));
	if(name == "AddCustomerInterface")
		return unique_ptr<AddCustomerInterface>( new AddCustomerInterface(rs, rq));
	if(name == "AddVendorInterface")
		return unique_ptr<AddVendorInterface>( new AddVendorInterface(rs, rq));
	if(name == "AddLeadInterface")
		return unique_ptr<AddLeadInterface>( new AddLeadInterface(rs, rq));
	if(name == "AddContactInterface")
		return unique_ptr<AddContactInterface>( new AddContactInterface(rs, rq));
	if(name == "IcrmIndex")
		return unique_ptr<IcrmIndex>( new IcrmIndex(rs, rq));
	if(name == "SearchCustomerInterface")
		return unique_ptr<SearchCustomerInterface>( new SearchCustomerInterface(rs, rq));
	if(name == "SearchCustomerRequest")
		return unique_ptr<SearchCustomerRequest>( new SearchCustomerRequest(rs, rq));
	if(name == "AddActivityInterface")
		return unique_ptr<AddActivityInterface>( new AddActivityInterface(rs, rq));
	if(name == "AddTransactionInterface")
		return unique_ptr<AddTransactionInterface>( new AddTransactionInterface(rs, rq));
	if(name == "AddTransactionRequest")
		return unique_ptr<AddTransactionRequest>( new AddTransactionRequest(rs, rq));
	if(name == "SearchContactActivity")
		return unique_ptr<SearchContactActivity>( new SearchContactActivity(rs, rq));	
	if(name == "AddTaskInterface")
		return unique_ptr<AddTaskInterface>( new AddTaskInterface(rs, rq));	
	if(name == "AddOrderInterface")
		return unique_ptr<AddOrderInterface>( new AddOrderInterface(rs, rq));	
	if(name == "AddCaseInterface")
		return unique_ptr<AddCaseInterface>( new AddCaseInterface(rs, rq));	
	if(name == "AddUserInterface")
		return unique_ptr<AddUserInterface>( new AddUserInterface(rs, rq));	
	if(name == "AddVendorInterface")
		return unique_ptr<AddVendorInterface>( new AddVendorInterface(rs, rq));	
	if(name == "CustomerizeRequest")
		return unique_ptr<CustomerizeRequest>( new CustomerizeRequest(rs, rq));	
	if(name == "UploadDocumentInterface")
		return unique_ptr<UploadDocumentInterface>( new UploadDocumentInterface(rs, rq));	
	if(name == "UploadDocumentRequest")
		return unique_ptr<UploadDocumentRequest>( new UploadDocumentRequest(rs, rq));	
	if(name == "AddEmployeeInterface")
		return unique_ptr<AddEmployeeInterface>( new AddEmployeeInterface(rs, rq));	
	if(name == "AddCampaignInterface")
		return unique_ptr<AddCampaignInterface>( new AddCampaignInterface(rs, rq));	
	if(name == "AddOpportunityInterface")
		return unique_ptr<AddOpportunityInterface>( new AddOpportunityInterface(rs, rq));	
	if(name == "LoginRequest")
		return unique_ptr<LoginRequest>( new LoginRequest(rs, rq));	
	if(name == "LogoutRequest")
		return unique_ptr<LogoutRequest>( new LogoutRequest(rs, rq));	
	
	return nullptr;
}
