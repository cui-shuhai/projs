
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class lead_table : public SqlAccessor{

public:
	lead_table();
	lead_table( int lead_id, string company_name, string contact_name, 
		string personal_title, string first_name, string last_name, 
		string phone, string email, string street_addr, string city, 
		string state, string post_code, string country, string bill_addr, 
		string ship_addr, int lead_source, int lead_status, int lead_rating);
	~lead_table();

	void add_lead_table();
	int get_lead_table_count();
	void get_lead_table_profile(std::map<int, string> &m);

	int get_lead_id(){ return lead_id; }
	string get_company_name(){ return company_name; }
	string get_contact_name(){ return contact_name; }
	string get_personal_title(){ return personal_title; }
	string get_first_name(){ return first_name; }
	string get_last_name(){ return last_name; }
	string get_phone(){ return phone; }
	string get_email(){ return email; }
	string get_street_addr(){ return street_addr; }
	string get_city(){ return city; }
	string get_state(){ return state; }
	string get_post_code(){ return post_code; }
	string get_country(){ return country; }
	string get_bill_addr(){ return bill_addr; }
	string get_ship_addr(){ return ship_addr; }
	int get_lead_source(){ return lead_source; }
	int get_lead_status(){ return lead_status; }
	int get_lead_rating(){ return lead_rating; }

	void set_lead_id(int lead_id_){ lead_id = lead_id_; }
	void set_company_name(string company_name_){ company_name = company_name_; }
	void set_contact_name(string contact_name_){ contact_name = contact_name_; }
	void set_personal_title(string personal_title_){ personal_title = personal_title_; }
	void set_first_name(string first_name_){ first_name = first_name_; }
	void set_last_name(string last_name_){ last_name = last_name_; }
	void set_phone(string phone_){ phone = phone_; }
	void set_email(string email_){ email = email_; }
	void set_street_addr(string street_addr_){ street_addr = street_addr_; }
	void set_city(string city_){ city = city_; }
	void set_state(string state_){ state = state_; }
	void set_post_code(string post_code_){ post_code = post_code_; }
	void set_country(string country_){ country = country_; }
	void set_bill_addr(string bill_addr_){ bill_addr = bill_addr_; }
	void set_ship_addr(string ship_addr_){ ship_addr = ship_addr_; }
	void set_lead_source(int lead_source_){ lead_source = lead_source_; }
	void set_lead_status(int lead_status_){ lead_status = lead_status_; }
	void set_lead_rating(int lead_rating_){ lead_rating = lead_rating_; }

private:
	int lead_id;
	string company_name;
	string contact_name;
	string personal_title;
	string first_name;
	string last_name;
	string phone;
	string email;
	string street_addr;
	string city;
	string state;
	string post_code;
	string country;
	string bill_addr;
	string ship_addr;
	int lead_source;
	int lead_status;
	int lead_rating;
};
