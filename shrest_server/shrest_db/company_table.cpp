
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
#include "shrest_db/company_table.h"

company_table::company_table():SqlAccessor()
{}

company_table::company_table(string id):SqlAccessor(),
	company_id(id)
{}

company_table::company_table( string company_id_, string name_, string address_, string phone_, string fax_, string parent_company_, string industry_type_, string annual_revenue_, string currency_id_, string credit_limit_, string credit_rating_, string time_zone_, string payment_terms_):
	SqlAccessor(),
	company_id{ company_id_ },
	name{ name_ },
	address{ address_ },
	phone{ phone_ },
	fax{ fax_ },
	parent_company{ parent_company_ },
	industry_type{ industry_type_ },
	annual_revenue{ annual_revenue_ },
	currency_id{ currency_id_ },
	credit_limit{ credit_limit_ },
	credit_rating{ credit_rating_ },
	time_zone{ time_zone_ },
	payment_terms{ payment_terms_ }
{ }




company_table::~company_table(){}

void company_table::add_company_table(){

	string sql = "INSERT INTO 'company'("
		"company_id, name, address, phone, fax, parent_company, industry_type, annual_revenue, currency_id, credit_limit, credit_rating, time_zone, payment_terms )  VALUES( "
	"?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";
	command c(*conn, sql);
	c.bind(1, company_id);
	c.bind(2, name);
	c.bind(3, address);
	c.bind(4, phone);
	c.bind(5, fax);
	c.bind(6, parent_company);
	c.bind(7, industry_type);
	c.bind(8, annual_revenue);
	c.bind(9, currency_id);
	c.bind(10, credit_limit);
	c.bind(11, credit_rating);
	c.bind(12, time_zone);
	c.bind(13, payment_terms);
	c.emit();
}
