
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
#include "vendor_table.h"

vendor_table::vendor_table():SqlAccessor()
{
}

vendor_table::vendor_table( int vendor_id_, string account_num_, int contact_, 
		string company_name_, int credit_rating_, int vendor_status_, 
		int active_flag_, string web_service_url_, string last_update_):
	SqlAccessor(),
	vendor_id{ vendor_id_ },
	account_num{ account_num_ },
	contact{ contact_ },
	company_name{ company_name_ },
	credit_rating{ credit_rating_ },
	vendor_status{ vendor_status_ },
	active_flag{ active_flag_ },
	web_service_url{ web_service_url_ },
	last_update{ last_update_ }
{
}

vendor_table::~vendor_table(){
}

void vendor_table::add_vendor_table(){

	auto sql = "INSERT INTO 'vendor'("
			"account_num, contact, company_name, "
			"credit_rating, vendor_status, active_flag, "
			"web_service_url, last_update "
			"VALUES( ?, ?, ?, ?, "
			"  ?, ?, ?, ? ";

	command c(*conn, sql);
	c.bind(1, account_num);
	c.bind(2, contact);
	c.bind(3, company_name);
	c.bind(4, credit_rating);
	c.bind(5, vendor_status);
	c.bind(6, active_flag);
	c.bind(7, web_service_url);
	c.bind(8, last_update);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	vendor_id = id_res->get_int(0);

	//t.commit();
}


int vendor_table::get_vendor_table_count(){
	string count_sql = "SELECT count(1) FROM vendor";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	return count_res->get_int(0);
}

void vendor_table::get_vendor_table_profile(std::map<int, string> &m)
{
/*
	string sql = "SELECT vendor_id, company_name FROM vendor";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
*/
}

void vendor_table::get_vendor_rating(std::map<int, string> &m)
{
	string sql = "SELECT rate, description FROM vendor_rate";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
}

