
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>
#include <vector>

#include "SqlAccessor.h"


using namespace std;
class order_table : public SqlAccessor{

public:
	order_table();
	order_table( string order_id, string customer_id, string product_id, double order_amount, string order_date, string order_status);
	~order_table();

	void add_order_table();
	void update_order_table();
	void get_order_instance(std::map<string, string> &order);
	int get_order_table_count();
	void get_order_list(std::map<string, string> &orders);
	void get_order_records( string source, string &result );

	string get_order_id(){return order_id;}
	string get_customer_id(){return customer_id;}
	string get_product_id(){return product_id;}
	double get_order_amount(){return order_amount;}
	string get_order_date(){return order_date;}
	string get_order_status(){return order_status;}

	void set_order_id(string order_id_){ order_id = order_id_; }
	void set_customer_id(string customer_id_){ customer_id = customer_id_; }
	void set_product_id(string product_id_){ product_id = product_id_; }
	void set_order_amount(double order_amount_){ order_amount = order_amount_; }
	void set_order_date(string order_date_){ order_date = order_date_; }
	void set_order_status(string order_status_){ order_status = order_status_; }


private:
	string order_id;
	string customer_id;
	string product_id;
	double order_amount;
	string order_date;
	string order_status;
};
