
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
#include "supplier_table.h"

supplier_table::supplier_table():SqlAccessor()
{
}

supplier_table::supplier_table( string supplier_id_, string account_num_, string contact_, 
		string company_name_, string credit_rating_, string supplier_status_, 
		string active_flag_, string web_service_url_, string last_update_):
	SqlAccessor(),
	supplier_id{ supplier_id_ },
	account_num{ account_num_ },
	contact{ contact_ },
	company_name{ company_name_ },
	credit_rating{ credit_rating_ },
	supplier_status{ supplier_status_ },
	active_flag{ active_flag_ },
	web_service_url{ web_service_url_ },
	last_update{ last_update_ }
{
}

supplier_table::~supplier_table(){
}

void supplier_table::add_supplier_table(){

	auto sql = "INSERT INTO 'supplier'("
			"account_num, contact, company_name, "
			"credit_rating, supplier_status, active_flag, "
			"web_service_url, last_update "
			"VALUES( ?, ?, ?, ?, "
			"  ?, ?, ?, ? ";

	command c(*conn, sql);
	c.bind(1, account_num);
	c.bind(2, contact);
	c.bind(3, company_name);
	c.bind(4, credit_rating);
	c.bind(5, supplier_status);
	c.bind(6, active_flag);
	c.bind(7, web_service_url);
	c.bind(8, last_update);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	supplier_id = id_res->get_int(0);

	//t.commit();
}


int supplier_table::get_supplier_table_count(){
	string count_sql = "SELECT count(1) FROM supplier";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	return count_res->get_int(0);
}

void supplier_table::get_supplier_table_profile(std::map<string, string> &m)
{
/*
	string sql = "SELECT supplier_id, company_name FROM supplier";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_int(0)] = res->get_string(1);
	} while(res->next_row());
*/
}

void supplier_table::get_supplier_rating(std::map<string, string> &m)
{
	string sql = "SELECT rating_name, description FROM supplier_rating";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(0)] = res->get_string(1);
	} while(res->next_row());
}

void supplier_table::get_supplier_rating(std::vector<string> &m)
{
	string sql = "SELECT rating_name FROM supplier_rating";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}

void supplier_table::get_supplier_status(std::vector<string> &m)
{
	string sql = "SELECT status_name FROM supplier_status";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}

void supplier_table::get_supplier_flag(std::vector<string> &m)
{
	string sql = "SELECT flag_name FROM supplier_flag";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m.push_back(res->get_string(0));
	} while(res->next_row());
}
