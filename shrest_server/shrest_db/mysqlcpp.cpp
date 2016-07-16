
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "shrest_log.h"
#include "shrest_db/mysqlcpp.h"

Msqlcpp::Msqlcpp()
{
	
	boost::property_tree::ptree pt;
    	boost::property_tree::read_json("config.txt", pt);

	auto database = pt.get<std::string>("database.schema");
	auto host = pt.get<std::string>("database.host");
	auto port = pt.get<std::string>("database.port");
	auto user = pt.get<std::string>("database.user");
	
	//final product should get password from command line or user saved place say database
	auto password = pt.get<std::string>("database.pwd");

	auto url = "tcp://" + host + ":" + port;
	try{
		driver = get_driver_instance();
		con.reset(driver->connect(url, user, password));

		con->setSchema(database);
		LOG("connected to ", url, "database; ", database);
	}
	catch (sql::SQLException &e) {
		LOG("ERR: SQLException: ", e.what(), " error code: ",  e.getErrorCode());
	}
	stmt.reset(nullptr);
	pstmt = nullptr;
	res.reset(nullptr);		
}

Msqlcpp::~Msqlcpp(){
}

	
void Msqlcpp::SetStatement(string statement){
	stmt.reset(con->createStatement());
  	res.reset(stmt->executeQuery(statement));
}

void Msqlcpp::PrepareStatement(string statement){
	pstmt = con->prepareStatement(statement);
}

sql::PreparedStatement*  Msqlcpp::GetPreparedStatement(){
	 return pstmt;
}

/*prepared statement should be manually executed
	 //res.reset(pstmt->executeQuery());
	the origional design is not friendly for wrap
*/

unique_ptr<sql::ResultSet>& Msqlcpp::GetResultset(){
	 return res;
}

#if 0
 sql::Connection *con;
sql::PreparedStatement  *prep_stmt
// ...

prep_stmt = con->prepareStatement("INSERT INTO test(id, label) VALUES (?, ?)");

prep_stmt->setInt(1, 1);
prep_stmt->setString(2, "a");
prep_stmt->execute();

prep_stmt->setInt(1, 2);
prep_stmt->setString(2, "b");
prep_stmt->execute();

delete prep_stmt;
delete con;
#endif
