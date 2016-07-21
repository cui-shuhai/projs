
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
#include "shrest_db/opportunity_table.h"

opportunity_table::opportunity_table():SqlAccessor()
{
}

opportunity_table::opportunity_table( int opportunity_, string opportunity_name_, int assign_to_, int contact_id_, int creator_id_, string close_date_, int pipeline_, double amount_, int probablity_):
	SqlAccessor(),
	opportunity{opportunity_},
	opportunity_name{opportunity_name_},
	assign_to{assign_to_},
	contact_id{contact_id_},
	creator_id{creator_id_},
	close_date{close_date_},
	pipeline{pipeline_},
	amount{amount_},
	probablity{probablity_}
{
}

opportunity_table::~opportunity_table(){
}
void opportunity_table::add_opportunity_table(){

	string sql = "INSERT INTO 'opportunity'(opportunity_name, assign_to, contact_id, creator_id, close_date, pipeline, amount, probablity) VALUES( ?, ?, ?, ?, ?, ?, ?, ?)"; 

	command c(*conn, sql);
	c.bind(1, opportunity_name);
	c.bind(2, assign_to);
	c.bind(3, contact_id);
	c.bind(4, creator_id);
	c.bind(5, close_date);
	c.bind(6, pipeline);
	c.bind(7, amount);
	c.bind(8, probablity);

	c.emit();
	string id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	opportunity = id_res->get_int(0);
}

int opportunity_table::get_opportunity_tableId()
{	
	return opportunity;
}
