
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

customer_table::customer_table():SqlAccessor()
{
}

customer_table::customer_table( string customer_id_, string  & company_name_, string  & contact_name_, 
			string  & personal_title_, string  & first_name_, string  & last_name_,
			string  & phone_, string  & email_, string  & street_addr_, string  & city_, 
			string  & state_, string  & post_code_, string  & country_, 
			string  & bill_addr_, string  & ship_addr_):
	SqlAccessor(),
	customer_id{ customer_id_ },
	company_name{ company_name_ },
	contact_name{ contact_name_ },
	personal_title{ personal_title_ },
	first_name{ first_name_ },
	last_name{ last_name_ },
	phone{ phone_ },
	email{ email_ },
	street_addr{ street_addr_ },
	city{ city_ },
	state{ state_ },
	post_code{ post_code_ },
	country{ country_ },
	bill_addr{ bill_addr_ },
	ship_addr{ ship_addr_ }
{
}

customer_table::~customer_table(){
}

void customer_table::add_customer_table(){

	auto sql = "INSERT INTO 'customer'("
		"company_name, contact_name, personal_title, first_name, last_name, phone, email, "
		"street_addr, city, state, post_code, country, bill_addr, ship_addr , customer_id)"
		"VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	command c(*conn, sql);

	c.bind(1, company_name);
	c.bind(2, contact_name);
	c.bind(3, personal_title);
	c.bind(4, first_name);
	c.bind(5, last_name);
	c.bind(6, phone);
	c.bind(7, email);
	c.bind(8, street_addr);
	c.bind(9, city);
	c.bind(10, state);
	c.bind(11, post_code);
	c.bind(12, country);
	c.bind(13, bill_addr);
	c.bind(14, ship_addr);
	c.bind(15, customer_id);

	c.emit();

	//t.commit();
}

int customer_table::get_customer_tableCount(){
	auto count_sql = "SELECT count(1) FROM customer";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	return count_res->get_int(0);
}

void customer_table::get_customer_profile(std::map<string, string> &m)
{

	string sql = "SELECT customer_id, company_name FROM customer";

	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		m[res->get_string(0)] = res->get_string(1);
	} while(res->next_row());
}
void customer_table::get_customer_records( string source, string &result ){

		stringstream ss;
		string sql = "SELECT customer_id, company_name, first_name, last_name, "
				" phone, email, street_addr, city, state, country, bill_addr, ship_addr, personal_title , post_code   FROM customer";

		if(!source.empty())
		sql.append("WHERE customer.company_name = ").append(source);

		query q(*conn, sql);
		LOG("sql", sql);

		result_type res =  q.emit_result();

		bool first = true;
		ss << "{ \"customer\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
 
			ss << "\"customer_id\"" << ":" << "\""  <<  res->get_string(0) << "\"" << ",";
			ss << "\"company_name\"" << ":" << "\""  << res->get_string(1) << "\"" << ",";
			ss << "\"contact_name\"" << ":" << "\""  << res->get_string(2) + " " + res->get_string(3) << "\"" << ",";
			ss << "\"personal_title\"" << ":" << "\""  << res->get_string(12) << "\"" << ",";
			ss << "\"first_name\"" << ":" << "\""  << res->get_string(2) << "\"" << ",";
			ss << "\"last_name\"" << ":" << "\""  << res->get_string(3) << "\"" << ",";
			ss << "\"phone\"" << ":" << "\""  << res->get_string(4) << "\"" << ",";
			ss << "\"email\"" << ":" << "\""  << res->get_string(5) << "\"" << ",";
			ss << "\"street_addr\"" << ":" << "\""  << res->get_string(6) << "\"" << ",";
			ss << "\"city\"" << ":" << "\""  << res->get_string(7) << "\"" << ",";
			ss << "\"state\"" << ":" << "\""  << res->get_string(8) << "\"" << ",";
			ss << "\"country\"" << ":" << "\""  << res->get_string(9) << "\"" << ",";
			ss << "\"bill_addr\"" << ":" << "\""  << res->get_string(10) << "\"" << ",";
			ss << "\"ship_addr\"" << ":" << "\""  << res->get_string(11) << "\"" << ",";
			ss << "\"post_code\"" << ":" << "\""  << res->get_string(13) << "\"" ;
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();

}

void customer_table::get_customer_instance(std::map<string, string> &customer){
		
		string sql = "SELECT customer_id, company_name, first_name, last_name, "
				" phone, email, street_addr, city, state, country, bill_addr, ship_addr, personal_title , post_code   FROM customer ";

		sql.append(" WHERE customer_id = ").append(customer_id);

		query q(*conn, sql);
		//LOG("sql", sql);

		result_type res =  q.emit_result();

 
		customer["customer_id"] = res->get_string(0);
		customer["company_name"] = res->get_string(1);
		customer["contact_name"] = res->get_string(2);
		customer["personal_title"] = res->get_string(12);
		customer["first_name"] = res->get_string(2);
		customer["last_name"] = res->get_string(3);
		customer["phone"] = res->get_string(4);
		customer["email"] = res->get_string(5);
		customer["street_addr"] = res->get_string(6);
		customer["city"] = res->get_string(7);
		customer["state"] = res->get_string(8);
		customer["country"] = res->get_string(9);
		customer["bill_addr"] = res->get_string(10);
		customer["ship_addr"] = res->get_string(11);
		customer["post_code"] = res->get_string(13);

}

void customer_table::update_customer_table(){

	stringstream ss;
	 ss <<  "UPDATE customer SET ";
	ss << "customer_id =" << "\"" << customer_id << "\"" << ",";
	ss << "company_name =" << "\"" << company_name << "\"" << ",";
	ss << "contact_name =" << "\"" << contact_name << "\"" << ",";
	ss << "personal_title =" << "\"" << personal_title << "\"" << ",";
	ss << "first_name =" << "\"" << first_name << "\"" << ",";
	ss << "last_name =" << "\"" << last_name << "\"" << ",";
	ss << "phone =" << "\"" << phone << "\"" << ",";
	ss << "email =" << "\"" << email << "\"" << ",";
	ss << "street_addr =" << "\"" << street_addr << "\"" << ",";
	ss << "city =" << "\"" << city << "\"" << ",";
	ss << "state =" << "\"" << state << "\"" << ",";
	ss << "country =" << "\"" << country << "\"" << ",";
	ss << "bill_addr =" << "\"" << bill_addr << "\"" << ",";
	ss << "ship_addr =" << "\"" << ship_addr << "\"" << ",";
	ss << "post_code =" << "\"" << post_code << "\"" ;
	ss << " WHERE customer_id = " << 	customer_id ;

	auto sql = ss.str();
	command c(*conn, sql);
	c.emit();

}
