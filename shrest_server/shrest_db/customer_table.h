
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class Customer : public SqlAccessor{

public:
	Customer();
	Customer( int customer_id, string  & company_name, string  & contact_name, 
			string  & personal_title, string  & first_name, string  & last_name,
			string  & phone, string  & email, string  & street_addr, string  & city, 
			string  & state, string  & post_code, string  & country, 
			string  & bill_addr, string  & ship_addr);
	~Customer();
	
	int get_customer_id(){ return customer_id; }
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

	void set_customer_id( int customer_id_ ){ customer_id = customer_id_; }
	void set_company_name( string company_name_ ){ company_name = company_name_; }
	void set_contact_name( string contact_name_ ){ contact_name = contact_name_; }
	void set_personal_title( string personal_title_ ){ personal_title = personal_title_; }
	void set_first_name( string first_name_ ){ first_name = first_name_; }
	void set_last_name( string last_name_ ){ last_name = last_name_; }
	void set_phone( string phone_ ){ phone = phone_; }
	void set_email( string email_ ){ email = email_; }
	void set_street_addr( string street_addr_ ){ street_addr = street_addr_; }
	void set_city( string city_ ){ city = city_; }
	void set_state( string state_ ){ state = state_; }
	void set_post_code( string post_code_ ){ post_code = post_code_; }
	void set_country( string country_ ){ country = country_; }
	void set_bill_addr( string bill_addr_ ){ bill_addr = bill_addr_; }
	void set_ship_addr( string ship_addr_ ){ ship_addr = ship_addr_; }

	void AddCustomer();
	int GetCustomerId();
	int GetCustomerCount();
	void GetCustomerProfile(std::map<int, string> &m);

private:
	int customer_id;
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
};
