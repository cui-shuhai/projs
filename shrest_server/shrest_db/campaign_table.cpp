
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
#include "shrest_db/campaign_table.h"

campaign_table::campaign_table():SqlAccessor()
{}

campaign_table::campaign_table(int id):SqlAccessor(),
	campaign_id(id)
{}

campaign_table::campaign_table( int campaign_id_, string campaign_name_, int assign_to_, string status_, int creator_id_, string start_date_, string close_date_, string description_):SqlAccessor(),
	 campaign_id{campaign_id_},
	 campaign_name{campaign_name_},
	 assign_to{assign_to_},
	 status{status_},
	 creator_id{creator_id_},
	 start_date{start_date_},
	 close_date{close_date_},
	 description{description_}
{ }

campaign_table::~campaign_table(){}

void campaign_table::add_campaign_table(){

	string sql = "INSERT INTO 'campaign'( campaign_name, assign_to, status, creator_id, start_date, close_date, description ) VALUES(?,?, ? ?, ?,?, ? )";

	command c(*conn, sql);
	c.bind(1, campaign_name);
	c.bind(2, assign_to);
	c.bind(3, status);
	c.bind(4, creator_id);
	c.bind(5, start_date);
	c.bind(6, close_date);
	c.bind(7, description);
	c.emit();
}
