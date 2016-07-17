
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>


using namespace std;
class Msqlcpp{

public:
	Msqlcpp();
	virtual ~Msqlcpp();
	/*
	void SetStatement(string stmt);
	void PrepareStatement(string stmt);
	sql::PreparedStatement* GetPreparedStatement();
	unique_ptr<sql::ResultSet>& GetResultset();
*/

protected:
/*
	sql::Driver* driver;
	unique_ptr<sql::Connection> con;
	unique_ptr<sql::Statement> stmt;
	sql::PreparedStatement* pstmt;
	unique_ptr<sql::ResultSet> res;
*/
};

