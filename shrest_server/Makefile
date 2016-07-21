SOURCE=server_instance.cpp \
	NLTemplate/NLTemplate.cpp \
	RequestResponse/RequestResponseFactory.cpp \
	RequestResponse/RequestResponse.cpp \
	RequestResponse/AddCustomerGetRequest.cpp \
	RequestResponse/JsonPostRequest.cpp \
	RequestResponse/ListCustomersGet.cpp \
	RequestResponse/NewCustomerPost.cpp \
	RequestResponse/PieGetRequest.cpp \
	RequestResponse/IcrmIndex.cpp \
	RequestResponse/SearchCustomerInterface.cpp \
	RequestResponse/SearchCustomerRequest.cpp \
	RequestResponse/AddEventInterface.cpp \
	RequestResponse/AddEventRequest.cpp \
	RequestResponse/AddTransactionInterface.cpp \
	RequestResponse/AddTransactionRequest.cpp \
	RequestResponse/AddTaskInterface.cpp \
	RequestResponse/AddTaskRequest.cpp \
	RequestResponse/ListTaskRequest.cpp \
	RequestResponse/LoginRequest.cpp \
	RequestResponse/SearchContactActivity.cpp \
	utils/shrest_utils.cpp \
	shrest_db/customers_table.cpp \
	shrest_db/contact_activity.cpp \
	shrest_db/exist_task.cpp \
	shrest_db/cookie_table.cpp \
	shrest_db/mysqlite.cpp

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

