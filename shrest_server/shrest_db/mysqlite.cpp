
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "shrest_log.h"
#include "mysqlite.h"

mysqlite::mysqlite()
{
  try
    {
	
	//boost::property_tree::ptree pt;
    	//boost::property_tree::read_json("./config.txt", pt);
	//auto database = pt.get<std::string>("database.schema");
	auto database = "crm_template.db";
	conn = new connection(database); 
    }
    catch (std::exception const& e)
    {
        std::cerr << e.what() << std::endl;
    }

}

mysqlite::~mysqlite(){
 if(conn != nullptr)
	delete conn;
}


#if 0
 	
/*
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
*/	
#endif
