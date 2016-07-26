

#include "JsonPostRequest.h"
#include "PieGetRequest.h"
#include "AddCustomerInterface.h"
#include "AddVendorInterface.h"
#include "AddLeadInterface.h"
#include "AddLeadRequest.h"
#include "EditLeadInterface.h"
#include "EditLeadRequest.h"
#include "EditCustomerInterface.h"
#include "EditCustomerRequest.h"
#include "AddContactInterface.h"
#include "AddContactRequest.h"
#include "AddLeadContactInterface.h"
#include "AddCustomerRequest.h"
#include "ListCustomerRequest.h"
#include "IcrmIndex.h"
#include "AddActivityInterface.h"
#include "AddActivityRequest.h"
#include "EditActivityInterface.h"
#include "EditActivityRequest.h"
#include "SearchCustomerInterface.h"
#include "SearchCustomerRequest.h"
#include "AddTransactionInterface.h"
#include "AddTransactionRequest.h"
#include "AddTaskInterface.h"
#include "AddTaskRequest.h"
#include "AddUserInterface.h"
#include "AddUserRequest.h"
#include "CustomerizeRequest.h"
#include "UploadDocumentInterface.h"
#include "UploadDocumentRequest.h"
#include "AddEmployeeInterface.h"
#include "AddEmployeeRequest.h"
#include "ListTaskRequest.h"
#include "ListCampaignRequest.h"
#include "ListCaseRequest.h"
#include "ListLeadRequest.h"
#include "ListActivityRequest.h"
#include "ListContactRequest.h"
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
	if(name == "AddCustomerInterface")
		return unique_ptr<AddCustomerInterface>( new AddCustomerInterface(rs, rq));
	if(name == "AddVendorInterface")
		return unique_ptr<AddVendorInterface>( new AddVendorInterface(rs, rq));
	if(name == "AddLeadInterface")
		return unique_ptr<AddLeadInterface>( new AddLeadInterface(rs, rq));
	if(name == "AddLeadRequest")
		return unique_ptr<AddLeadRequest>( new AddLeadRequest(rs, rq));
	if(name == "EditLeadInterface")
		return unique_ptr<EditLeadInterface>( new EditLeadInterface(rs, rq));
	if(name == "EditLeadRequest")
		return unique_ptr<EditLeadRequest>( new EditLeadRequest(rs, rq));
	if(name == "EditCustomerInterface")
		return unique_ptr<EditCustomerInterface>( new EditCustomerInterface(rs, rq));
	if(name == "EditCustomerRequest")
		return unique_ptr<EditCustomerRequest>( new EditCustomerRequest(rs, rq));
	if(name == "AddContactInterface")
		return unique_ptr<AddContactInterface>( new AddContactInterface(rs, rq));
	if(name == "AddContactRequest")
		return unique_ptr<AddContactRequest>( new AddContactRequest(rs, rq));
	if(name == "AddLeadContactInterface")
		return unique_ptr<AddLeadContactInterface>( new AddLeadContactInterface(rs, rq));
	if(name == "AddCustomerRequest")
		return unique_ptr<AddCustomerRequest>( new AddCustomerRequest(rs, rq));
	if(name == "ListCustomerRequest")
		return unique_ptr<ListCustomerRequest>( new ListCustomerRequest(rs, rq));
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
	if(name == "EditActivityInterface")
		return unique_ptr<EditActivityInterface>( new EditActivityInterface(rs, rq));
	if(name == "EditActivityRequest")
		return unique_ptr<EditActivityRequest>( new EditActivityRequest(rs, rq));
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
	if(name == "CustomerizeRequest")
		return unique_ptr<CustomerizeRequest>( new CustomerizeRequest(rs, rq));	
	if(name == "UploadDocumentInterface")
		return unique_ptr<UploadDocumentInterface>( new UploadDocumentInterface(rs, rq));	
	if(name == "UploadDocumentRequest")
		return unique_ptr<UploadDocumentRequest>( new UploadDocumentRequest(rs, rq));	
	if(name == "AddEmployeeInterface")
		return unique_ptr<AddEmployeeInterface>( new AddEmployeeInterface(rs, rq));	
	if(name == "AddEmployeeRequest")
		return unique_ptr<AddEmployeeRequest>( new AddEmployeeRequest(rs, rq));	
	if(name == "ListTaskRequest")
		return unique_ptr<ListTaskRequest>( new ListTaskRequest(rs, rq));	
	if(name == "ListCampaignRequest")
		return unique_ptr<ListCampaignRequest>( new ListCampaignRequest(rs, rq));	
	if(name == "ListCaseRequest")
		return unique_ptr<ListCaseRequest>( new ListCaseRequest(rs, rq));	
	if(name == "ListLeadRequest")
		return unique_ptr<ListLeadRequest>( new ListLeadRequest(rs, rq));	
	if(name == "ListActivityRequest")
		return unique_ptr<ListActivityRequest>( new ListActivityRequest(rs, rq));	
	if(name == "ListContactRequest")
		return unique_ptr<ListContactRequest>( new ListContactRequest(rs, rq));	
	if(name == "ListOpportunityRequest")
		return unique_ptr<ListOpportunityRequest>( new ListOpportunityRequest(rs, rq));	
	if(name == "LoginRequest")
		return unique_ptr<LoginRequest>( new LoginRequest(rs, rq));	
	if(name == "LogoutRequest")
		return unique_ptr<LogoutRequest>( new LogoutRequest(rs, rq));	
	
	return nullptr;
}
