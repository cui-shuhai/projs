

#include "SqlAccessorFactory.h"

unique_ptr<SqlAccessor> SqlAccessFactory::CreateAccessor(string accessor_name, const string &table_name){
	if(accessor_name == "JsonPost")
	;	//return unique_ptr<LoginRequest>( new LoginRequest(rs, rq));	
	
	return nullptr;
	}
