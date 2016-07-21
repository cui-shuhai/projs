
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_log.h"
#include "shrest_db/customers_table.h"

contact_activity_view::contact_activity_view():SqlAccessor()
{
}


contact_activity_view::~contact_activity_view(){
}

void contact_activity_view::Addcontact_activity_view(){

}

int contact_activity_view::Getcontact_activity_viewId()
{	
	return id_;
}
