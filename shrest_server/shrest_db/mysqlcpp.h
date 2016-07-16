
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>


#include "cppconn/driver.h"
#include "cppconn/exception.h"
#include "cppconn/resultset.h"
#include "cppconn/prepared_statement.h"
#include "cppconn/statement.h"

using namespace std;
class Msqlcpp{

public:
	Msqlcpp();
	virtual ~Msqlcpp();
	
	void SetStatement(string stmt);
	void PrepareStatement(string stmt);
	sql::PreparedStatement* GetPreparedStatement();
	unique_ptr<sql::ResultSet>& GetResultset();

protected:

	sql::Driver* driver;
	unique_ptr<sql::Connection> con;
	unique_ptr<sql::Statement> stmt;
	sql::PreparedStatement* pstmt;
	unique_ptr<sql::ResultSet> res;
};

