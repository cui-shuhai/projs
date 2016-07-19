
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


unique_ptr<query> mysqlite::BuildQuery(const string &sql){
	return unique_ptr<query>(new query(*conn, sql));
}

