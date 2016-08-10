
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class supplier_table : public SqlAccessor{

public:
	supplier_table();
	supplier_table( string supplier_id, string account_num, string contact, 
		string company_name, string credit_rating, string supplier_status, 
		string active_flag, string web_service_url, string last_update);
	~supplier_table();

	void add_supplier_table();
	string get_supplier_table_count();
	void get_supplier_table_profile(std::map<string, string> &m);
	void get_supplier_rating(std::map<string, string> &m);

	string get_supplier_id(){ return supplier_id;}
	string get_account_num(){ return account_num;}
	string get_contact(){ return contact;}
	string get_company_name(){ return company_name;}
	string get_credit_rating(){ return credit_rating;}
	string get_supplier_status(){ return supplier_status;}
	string get_active_flag(){ return active_flag;}
	string get_web_service_url(){ return web_service_url;}
	string get_last_update(){ return last_update;}

	void set_supplier_id(string supplier_id_){ supplier_id = supplier_id_; }
	void set_account_num(string account_num_){ account_num = account_num_; }
	void set_contact(string contact_){ contact = contact_; }
	void set_company_name(string company_name_){ company_name = company_name_; }
	void set_credit_rating(string credit_rating_){ credit_rating = credit_rating_; }
	void set_supplier_status(string supplier_status_){ supplier_status = supplier_status_; }
	void set_active_flag(string active_flag_){ active_flag = active_flag_; }
	void set_web_service_url(string web_service_url_){ web_service_url = web_service_url_; }
	void set_last_update(string last_update_){ last_update = last_update_; }

private:
	string supplier_id;
	string account_num;
	string contact;
	string company_name;
	string credit_rating;
	string supplier_status;
	string active_flag;
	string web_service_url;
	string last_update;
};

