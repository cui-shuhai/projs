
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_log.h"
#include "shrest_db/customers_table.h"

Customer::Customer():mysqlite()
{
}

Customer::Customer(int id, string firstName, string lastName, int age, string phone, string address):
	mysqlite(),
	id_{id},
	firstName_{firstName},
	lastName_{lastName},
	age_{age},
	phone_{phone},
	address_{address}
{
}

Customer::~Customer(){
}

void Customer::AddCustomer(){

	auto sql = "INSERT INTO 'customer'(id_, firstName, lastName, age, phone, address) VALUES(?, ?, ?, ?, ?, ?)";
	
	command c(*conn, sql);
	c.bind(1, id_);
	c.bind(2, firstName_);
	c.bind(3, lastName_);
	c.bind(4, age_);
	c.bind(5, phone_);
	c.bind(6, address_);

	c.emit();

}

unique_ptr<query> Customer::BuildQuery(const string &sql){
	return unique_ptr<query>(new query(*conn, sql));
}
