
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include <sqlite/connection.hpp>
#include <sqlite/query.hpp>
#include <sqlite/result.hpp>
using namespace sqlite;

using namespace std;
class mysqlite{

public:
	mysqlite();
	virtual ~mysqlite();
	unique_ptr<query> BuildQuery(const string &sql);
protected:
	connection* conn;
};

