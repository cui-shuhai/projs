
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class vendor_table : public SqlAccessor{

public:
	vendor_table();
	vendor_table( int vendor_id, string account_num, int contact, 
		string company_name, int credit_rating, int vendor_status, 
		int active_flag, string web_service_url, string last_update);
	~vendor_table();

	void add_vendor_table();
	int get_vendor_table_count();
	void get_vendor_table_profile(std::map<int, string> &m);
	void get_vendor_rating(std::map<int, string> &m);

	int get_vendor_id(){ return vendor_id;}
	string get_account_num(){ return account_num;}
	int get_contact(){ return contact;}
	string get_company_name(){ return company_name;}
	int get_credit_rating(){ return credit_rating;}
	int get_vendor_status(){ return vendor_status;}
	int get_active_flag(){ return active_flag;}
	string get_web_service_url(){ return web_service_url;}
	string get_last_update(){ return last_update;}

	void set_vendor_id(int vendor_id_){ vendor_id = vendor_id_; }
	void set_account_num(string account_num_){ account_num = account_num_; }
	void set_contact(int contact_){ contact = contact_; }
	void set_company_name(string company_name_){ company_name = company_name_; }
	void set_credit_rating(int credit_rating_){ credit_rating = credit_rating_; }
	void set_vendor_status(int vendor_status_){ vendor_status = vendor_status_; }
	void set_active_flag(int active_flag_){ active_flag = active_flag_; }
	void set_web_service_url(string web_service_url_){ web_service_url = web_service_url_; }
	void set_last_update(string last_update_){ last_update = last_update_; }

private:
	int vendor_id;
	string account_num;
	int contact;
	string company_name;
	int credit_rating;
	int vendor_status;
	int active_flag;
	string web_service_url;
	string last_update;
};

