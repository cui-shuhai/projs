
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "shrest_log.h"
#include "shrest_db/customers_table.h"

Customer::Customer()
{
}

Customer::Customer(int id, string firstName, string lastName, int age, string phone, string address):
	Msqlcpp(),
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
/*
	unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement("INSER INTO crm_template(customer_id, first_name, last_name, age, phone, address) VALUES(?, ?, ?, ?, ?, ?)"));

	pstmt->setInt(1, id_);
	pstmt->setString(2, firstName_);
	pstmt->setString(3, lastName_);
	pstmt->setInt(4, age_);
	pstmt->setString(5, phone_);
	pstmt->setString(6, address_);

	pstmt->execute();*/
}

