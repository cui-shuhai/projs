SOURCE=server_instance.cpp \
	NLTemplate/NLTemplate.cpp \
	RequestResponse/RequestResponseFactory.cpp \
	RequestResponse/RequestResponse.cpp \
	RequestResponse/AddCustomerInterface.cpp \
	RequestResponse/AddSupplierInterface.cpp \
	RequestResponse/AddLeadInterface.cpp \
	RequestResponse/AddContactInterface.cpp \
	RequestResponse/JsonPostRequest.cpp \
	RequestResponse/PieGetRequest.cpp \
	RequestResponse/IcrmIndex.cpp \
	RequestResponse/CustomerizeRequest.cpp \
	RequestResponse/SearchCustomerInterface.cpp \
	RequestResponse/SearchCustomerRequest.cpp \
	RequestResponse/AddActivityInterface.cpp \
	RequestResponse/AddTransactionInterface.cpp \
	RequestResponse/AddTransactionRequest.cpp \
	RequestResponse/AddTaskInterface.cpp \
	RequestResponse/AddOrderInterface.cpp \
	RequestResponse/AddCaseInterface.cpp \
	RequestResponse/AddCampaignInterface.cpp \
	RequestResponse/AddOpportunityInterface.cpp \
	RequestResponse/AddUserInterface.cpp \
	RequestResponse/UploadDocumentInterface.cpp \
	RequestResponse/UploadDocumentRequest.cpp \
	RequestResponse/AddEmployeeInterface.cpp \
	RequestResponse/LoginRequest.cpp \
	RequestResponse/LogoutRequest.cpp \
	RequestResponse/SearchContactActivity.cpp \
	utils/shrest_utils.cpp \
	shrest_db/customer_table.cpp \
	shrest_db/lead_table.cpp \
	shrest_db/contact_table.cpp \
	shrest_db/activity_table.cpp \
	shrest_db/activity_status.cpp \
	shrest_db/activity_type.cpp \
	shrest_db/activity_priority.cpp \
	shrest_db/task_table.cpp \
	shrest_db/cookie_table.cpp \
	shrest_db/user_table.cpp \
	shrest_db/supplier_table.cpp \
	shrest_db/employee_table.cpp \
	shrest_db/employee_title.cpp \
	shrest_db/employee_department.cpp \
	shrest_db/employee_role.cpp \
	shrest_db/employee_profile.cpp \
	shrest_db/campaign_table.cpp \
	shrest_db/company_table.cpp \
	shrest_db/case_table.cpp \
	shrest_db/order_table.cpp \
	shrest_db/case_status.cpp \
	shrest_db/case_priority.cpp \
	shrest_db/case_type.cpp \
	shrest_db/case_reason.cpp \
	shrest_db/opportunity_table.cpp \
	shrest_db/SqlAccessor.cpp \
	shrest_db/SqlAccessorFactory.cpp \
#	RequestResponse/AddActivityRequest.cpp \
#	RequestResponse/ListActivityRequest.cpp 
#	RequestResponse/EditActivityInterface.cpp \
	#RequestResponse/EditActivityRequest.cpp \
	RequestResponse/AddLeadRequest.cpp \
	RequestResponse/EditLeadInterface.cpp \
	RequestResponse/EditLeadRequest.cpp \
	RequestResponse/ListLeadRequest.cpp \
	RequestResponse/AddCustomerRequest.cpp \

MYPROGRAM=crm_server

MYINCLUDES=-I/usr/include -I/usr/local/include  -I. -I./RequestResponse -I./NLTemplate -I ./utils -I./shird_party -I./shrest_db

OPTIONS=-std=c++11 -g 

LIBRARYPATH=-L/usr/lib/x86_64-linux-gnu 
#debuge modules
MYLIBRARIES= -lpthread  -lboost_date_time -lboost_filesystem -lboost_thread \
-lboost_regex -lboost_system  -lboost_coroutine -lboost_context  -lvsqlitepp


CC=g++

#------------------------------------------------------------------------------



all: $(MYPROGRAM)



$(MYPROGRAM): $(SOURCE)

	$(CC)  $(OPTIONS) $(MYINCLUDES) $(SOURCE) -o$(MYPROGRAM) $(LIBRARYPATH) $(MYLIBRARIES)

clean:

	rm -f $(MYPROGRAM)

