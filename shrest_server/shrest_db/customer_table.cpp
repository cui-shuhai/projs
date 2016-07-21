
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
#include "shrest_db/customer_table.h"

Customer::Customer():SqlAccessor()
{
}

Customer::Customer(int id, string firstName, string lastName, int age, string phone, string address):
	SqlAccessor(),
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

	//auto sql = "INSERT INTO 'customer'(id_, firstName, lastName, age, phone, address) VALUES(?, ?, ?, ?, ?, ?)";
	auto sql = "INSERT INTO 'customer'(firstName, lastName, age, phone, address) VALUES(?, ?, ?, ?, ?)";

//INSERT INTO 'customer'(firstName, lastName, age, phone, address) VALUES("d", "kd", 12, "1223", "sdfh");

	//should use transaction but t.begin() crashes
	//transaction t(*conn);
	//t.begin();
	
#if 1	
	command c(*conn, sql);
	c.bind(1, firstName_);
	c.bind(2, lastName_);
	c.bind(3, age_);
	c.bind(4, phone_);
	c.bind(5, address_);
#else
	c.bind(1, id_);
	c.bind(2, firstName_);
	c.bind(3, lastName_);
	c.bind(4, age_);
	c.bind(5, phone_);
	c.bind(6, address_);
#endif
	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	id_ = id_res->get_int(0);

	//t.commit();
}

int Customer::GetCustomerId()
{	
	return id_;
}
