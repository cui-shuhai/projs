
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>
using namespace sqlite;

using namespace std;
class SqlAccessor{
public:
	SqlAccessor();
	virtual ~SqlAccessor();
	unique_ptr<query> BuildQuery(const string &sql);
	void SetUser(int id){user_id = id;}
	int GetUser(){return user_id;}
protected:
	connection* conn;
	int user_id; //the user who access
};

