
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

employee_table::employee_table(int employee_id_, string firstName_, string lastName_, int age_, string address_, string mobile_phone_, string office_phone_, string home_phone_, string email_, int job_title_, int department_id_, int reports_to_ , string create_date_, int created_by_):
	SqlAccessor(),
	employee_id{employee_id_},
	firstName{firstName_},
	lastName{lastName_},
	age{age_},
	address{address_},
	mobile_phone{mobile_phone_},
	office_phone{office_phone_},
	home_phone{home_phone_},
	email{email_},
	job_title{job_title_},
	department_id{department_id_},
	reports_to{reports_to_},
	create_date{create_date_},
	created_by{created_by_}
{
}

employee_table::~employee_table(){
}

void employee_table::add_employee_table(){

	auto sql = "INSERT INTO 'employee'"
		"( firstName, lastName, age, address, mobile_phone, office_phone, home_phone, email, job_title, department_id, reports_to, create_date, created_by )" 
		" VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	command c(*conn, sql);
	c.bind(1, firstName);
	c.bind(2, lastName);
	c.bind(3, age);
	c.bind(4, address);
	c.bind(5, mobile_phone);
	c.bind(6, office_phone);
	c.bind(7, home_phone);
	c.bind(8, email);
	c.bind(9, job_title);
	c.bind(10, department_id);
	c.bind(11, reports_to);
	c.bind(12, create_date);
	c.bind(13, created_by);

	c.emit();
	auto id_sql = "SELECT last_insert_rowid()";
	query id_query(*conn, id_sql);
	auto id_res = id_query.emit_result();
	employee_id = id_res->get_int(0);

}

int employee_table::get_employee_tableId(){
	return employee_id;
}

void employee_table::get_employee_list(std::map<int, string> &employees){
	auto count_sql = "SELECT count(1) FROM employee";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	auto rows = count_res->get_int(0);

	if(rows == 0)
		return;

	string sql = "SELECT employee_id, firstName, lastName, employee_department.name "
			"FROM employee INNER JOIN employee_department ON employee.department_id = employee_department.department_id  ";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		string employee_item = res->get_string(1) + " " + res->get_string(2) +":" + res->get_string(3);
		employees[res->get_int(0)] = employee_item;
	} while(res->next_row());
}

void employee_table::get_department_managers(std::map<int , string> &managers)
{	
	auto count_sql = "SELECT count(1) "
			"FROM employee INNER JOIN employee_title ON employee.job_title = employee_title.title_id "
			"INNER JOIN employee_department ON employee.department_id = employee_department.department_id  "
			"where employee.job_title = 'manager'";

	query count_query(*conn, count_sql);
	auto count_res = count_query.emit_result();
	auto rows = count_res->get_int(0);

	if(rows == 0)
		return;

	string sql = "SELECT employee_id, firstName, lastName, employee_department.name "
			"FROM employee INNER JOIN employee_title ON employee.job_title = employee_title.title_id "
			"INNER JOIN employee_department ON employee.department_id = employee_department.department_id  "
			"where employee.job_title = 'manager'";
	
	query q(*conn, sql);
	auto res = q.emit_result();

	do{
		string manager = res->get_string(1) + " " + res->get_string(2) +":" + res->get_string(3);
		managers[res->get_int(0)] = manager;
	} while(res->next_row());
}
