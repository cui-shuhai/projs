
/* Standard C++ includes */
#include <stdlib.h>
#include <memory>
#include <iostream>
#include <sstream>
#include <string>


#define BOOST_SPIRIT_THREADSAFE

#include <sqlite/transaction.hpp>
#include <sqlite/connection.hpp>
#include <sqlite/command.hpp>
#include <sqlite/execute.hpp>

#include "shrest_utils.h"
#include "order_table.h"
#include "shrest_log.h"

using namespace std;

order_table::order_table():SqlAccessor()
{
}

order_table::order_table( string order_id_, string customer_id_, string product_id_, double order_amount_, string order_date_, string order_status_):
	SqlAccessor(),
	order_id(order_id_),
	customer_id(customer_id_),
	product_id(product_id_),
	order_amount(order_amount_),
	order_date(order_date_),
	order_status(order_status_)
{
}

order_table::~order_table(){
}

void order_table::add_order_table(){

	string sql = "INSERT INTO 'customer_order'( order_id, customer_id, product_id, order_amount, order_date, order_status )"
		"VALUES( ";

	stringstream ss;
	ss << sql;
	ss << "'" << order_id << "'" << ", ";
	ss << "'" << customer_id << "'" << ", ";
	ss << "'" << product_id << "'" << ", ";
	ss << "'" << order_amount << "'" << ", ";
	ss << "'" << order_date << "'" << ", ";
	ss << "'" << order_status << "'" << ")";

	sql = ss.str();
	LOG( "add_order sqql:", sql);
	command c(*conn, sql);

	c.emit();
}


int order_table::get_order_table_count(){
	string count_sql = "SELECT count(1) FROM customer_order";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	return count_res->get_int(0);
}


void order_table::get_order_list(std::map<string, string> &orders){
}
void order_table::get_order_instance(std::map<string, string> &order){


	string sql = "SELECT order_id, customer_id, product_id, order_amount, order_date, order_status "
	" FROM customer_order ";

		sql.append(" WHERE order_id =  '").append( order_id ).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
		
	
		order["order_id"] = res->get_string(0);
		order["customer_id"] = res->get_string(1);
		order["product_id"] = res->get_string(2);
		order["order_amount"] = res->get_double(3);
		order["order_date"] = res->get_string(4);
		order["order_status"] = res->get_string(5);
}

void order_table::update_order_table(){

	stringstream ss;
	ss <<  "UPDATE customer_order SET ";
	ss << "customer_id =" << "\"" << customer_id << "\"" << ",";
	ss << "product_id =" << "\"" << product_id << "\"" << ",";
	ss << "order_amount =" << "\"" << order_amount << "\"" << ",";
	ss << "order_date =" << "\"" << order_date << "\"" << ",";
	ss << "order_status =" << "\"" << order_status << "\"" ;
	ss << " WHERE order_id = " <<  "\"" << 	order_id <<  "\"" ;


	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();

}
void order_table::get_order_records( string source, string &result ){

	string sql = "SELECT order_id, customer_id, product_id, order_amount, order_date, order_status "
	" FROM customer_order";

		if(!source.empty())
		sql.append("  WHERE order_id = '").append(source).append("'");
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"recordset\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss << "\"order_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"customer_id\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"product_id\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"order_amount\"" << ":" << "\"" << res->get_double(3) << "\"" << ",";
			ss << "\"order_date\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"order_status \"" << ":" << "\"" << res->get_string(5) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}
