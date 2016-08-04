
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
#include "shrest_db/employee_table.h"

employee_table::employee_table():SqlAccessor()
{
}

employee_table::employee_table(string employee_id_, string first_name_, string last_name_, int age_, string address_, string mobile_phone_, string office_phone_, string home_phone_, string email_, string job_title_, string department_name_, string reports_to_ , string create_date_, string created_by_):
	SqlAccessor(),
	employee_id{employee_id_},
	first_name{first_name_},
	last_name{last_name_},
	age{age_},
	address{address_},
	mobile_phone{mobile_phone_},
	office_phone{office_phone_},
	home_phone{home_phone_},
	email{email_},
	job_title{job_title_},
	department_name{department_name_},
	reports_to{reports_to_},
	create_date{create_date_},
	created_by{created_by_}
{
}

employee_table::~employee_table(){
}

void employee_table::add_employee_table(){

	auto sql = "INSERT INTO 'employee'"
		"(employee_id, first_name, last_name, age, address, mobile_phone, office_phone, home_phone, email, job_title, department_name, reports_to, create_date, created_by )" 
		" VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, employee_id);
	c.bind(2, first_name);
	c.bind(3, last_name);
	c.bind(4, age);
	c.bind(5, address);
	c.bind(6, mobile_phone);
	c.bind(7, office_phone);
	c.bind(8, home_phone);
	c.bind(9, email);
	c.bind(10, job_title);
	c.bind(11, department_name);
	c.bind(12, reports_to);
	c.bind(13, create_date);
	c.bind(14, created_by);

	c.emit();
}

void employee_table::get_employee_list(std::map<string, string> &employees){
	auto count_sql = "SELECT count(1) FROM employee";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	auto rows = count_res->get_int(0);

	if(rows == 0)
		return;

	string sql = "SELECT employee_id, first_name, last_name, department_name "
			"FROM employee " ;
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		string employee_item = res->get_string(1) + " " + res->get_string(2) +":" + res->get_string(3);
		employees[res->get_string(0)] = employee_item;
	} while(res->next_row());
}

void employee_table::get_department_managers(std::map<string , string> &managers)
{	
	auto count_sql = "SELECT count(1) "
			"FROM employee INNER JOIN employee_title ON employee.job_title = employee_title.title_name "
			"INNER JOIN employee_department ON employee.department_name = employee_department.department_name  "
			"where employee.job_title = 'manager'";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	auto rows = count_res->get_int(0);

	if(rows == 0)
		return;

	string sql = "SELECT employee_id, first_name, last_name, department_name "
			"FROM employee where employee.job_title = 'manager'";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		string manager = res->get_string(1) + " " + res->get_string(2);
		managers[res->get_string(0)] = manager;
	} while(res->next_row());
}

void employee_table::get_employee_instance( string source, string &result ){

		string sql = "SELECT employee_id, first_name, last_name, age, address, mobile_phone, office_phone, home_phone, email, job_title, department_name, reports_to, create_date, created_by FROM employee WHERE employee_id = ";

		if(!source.empty())
		sql.append("'").append(source).append("'");
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
			ss << "\"employee_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"first_name\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"last_name\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"age\"" << ":" << "\"" << to_string(res->get_int(3)) << "\"" << ",";
			ss << "\"address\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"mobile_phone\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"office_phone\"" << ":" << "\"" << res->get_string(6) << "\"" << ",";
			ss << "\"home_phone\"" << ":" << "\"" << res->get_string(7) << "\"" << ",";
			ss << "\"email\"" << ":" << "\"" << res->get_string(8) << "\"" << ",";
			ss << "\"job_title\"" << ":" << "\"" << res->get_string(9) << "\"" << ",";
			ss << "\"department_name\"" << ":" << "\"" << res->get_string(10) << "\"" << ",";
			ss << "\"reports_to\"" << ":" << "\"" << res->get_string(11) << "\"" << ",";
			ss << "\"create_date\"" << ":" << "\"" << res->get_string(12) << "\"" << ",";
			ss << "\"created_by\"" << ":" << "\"" << res->get_string(13) << "\""; 
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}
void employee_table::get_employee_records(string source, string &result ){

		string sql = "SELECT employee_id, first_name, last_name, age, address, mobile_phone, office_phone, home_phone, email, job_title, department_name, reports_to, create_date, created_by FROM employee ";

		if(!source.empty())
		sql.append("WHERE employee.employee_source = ").append(source);
		query q(*conn, sql);
		LOG("sql", sql);
		auto res = q.emit_result();
	
		stringstream ss;

		bool first = true;
		ss << "{ \"employee\":[ ";
		do{
			if(first)
				first = false;
			else{
				ss << ", ";
			}
			ss << "{" ;
			ss << "\"employee_id\"" << ":" << "\"" << res->get_string(0) << "\"" << ",";
			ss << "\"first_name\"" << ":" << "\"" << res->get_string(1) << "\"" << ",";
			ss << "\"last_name\"" << ":" << "\"" << res->get_string(2) << "\"" << ",";
			ss << "\"age\"" << ":" << "\"" << to_string(res->get_int(3)) << "\"" << ",";
			ss << "\"address\"" << ":" << "\"" << res->get_string(4) << "\"" << ",";
			ss << "\"mobile_phone\"" << ":" << "\"" << res->get_string(5) << "\"" << ",";
			ss << "\"office_phone\"" << ":" << "\"" << res->get_string(6) << "\"" << ",";
			ss << "\"home_phone\"" << ":" << "\"" << res->get_string(7) << "\"" << ",";
			ss << "\"email\"" << ":" << "\"" << res->get_string(8) << "\"" << ",";
			ss << "\"job_title\"" << ":" << "\"" << res->get_string(9) << "\"" << ",";
			ss << "\"department_name\"" << ":" << "\"" << res->get_string(10) << "\"" << ",";
			ss << "\"reports_to\"" << ":" << "\"" << res->get_string(11) << "\"" << ",";
			ss << "\"create_date\"" << ":" << "\"" << res->get_string(12) << "\"" << ",";
			ss << "\"created_by\"" << ":" << "\"" << res->get_string(13) << "\""; 
			ss << "}";
		} while(res->next_row());

		ss << " ] }";
		result = ss.str();
}
void employee_table::update_employee_table()
{
	stringstream ss;
	ss <<  "UPDATE employee SET ";
	ss << "first_name =" << "\"" << first_name << "\"" << ",";
	ss << "last_name =" << "\"" << last_name << "\"" << ",";
	ss << "age =" << "\"" << age << "\"" << ",";
	ss << "address =" << "\"" << address << "\"" << ",";
	ss << "mobile_phone =" << "\"" << mobile_phone << "\"" << ",";
	ss << "office_phone =" << "\"" << office_phone << "\"" << ",";
	ss << "home_phone =" << "\"" << home_phone << "\"" << ",";
	ss << "email =" << "\"" << email << "\"" << ",";
	ss << "job_title =" << "\"" << job_title << "\"" << ",";
	ss << "department_name =" << "\"" << department_name << "\"" << ",";
	ss << "reports_to =" << "\"" << reports_to << "\"" << ",";
	ss << "create_date =" << "\"" << create_date << "\"" << ",";
	ss << "created_by =" << "\"" << created_by << "\"" ;
	ss << " WHERE employee_id =" << "\"" << employee_id << "\"" ;

	string sql = ss.str();
	command c(*conn, sql);
	c.emit();
}
