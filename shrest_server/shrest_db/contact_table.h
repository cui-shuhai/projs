
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class contact_table : public SqlAccessor{

public:
	contact_table();
	contact_table( int contact_id, int status, string firstName,
		 string lastName, int contact_from, string address, 
		 string primary_phone, string alt_phone, string mobile_phone, 
		 string fax, string email, string twitter, string linkedin, 
		 string facebook, string job_title, int company_id, 
		 string when_met, string where_met, string time_zone, 
		 int main_contact, int out_of_marketing, int out_of_billing, 
                 string extra_info);

	~contact_table();
	
	void add_contact_table();
	int get_contact_tableId();
	void get_contact_list(std::map<int, string> &contacts);
	int get_contact_id(){ return contact_id; }
	int get_status(){ return status; }
	string get_firstName(){ return firstName; }
	string get_lastName(){ return lastName; }
	int get_contact_from(){ return contact_from; }
	string get_address(){ return address; }
	string get_primary_phone(){ return primary_phone; }
	string get_alt_phone(){ return alt_phone; }
	string get_mobile_phone(){ return mobile_phone; }
	string get_fax(){ return fax; }
	string get_email(){ return email; }
	string get_twitter(){ return twitter; }
	string get_linkedin(){ return linkedin; }
	string get_facebook(){ return facebook; }
	string get_job_title(){ return job_title; }
	int get_company_id(){ return company_id; }
	string get_when_met(){ return when_met; }
	string get_where_met(){ return where_met; }
	string get_time_zone(){ return time_zone; }
	int get_main_contact(){ return main_contact; }
	int get_out_of_marketing(){ return out_of_marketing; }
	int get_out_of_billing(){ return out_of_billing; }
	string get_extra_info(){ return extra_info; }

	void set_contact_id(int contact_id_){ contact_id = contact_id_; }
	void set_status(int status_){ status = status_; }
	void set_firstName(string firstName_){ firstName = firstName_; }
	void set_lastName(string lastName_){ lastName = lastName_; }
	void set_contact_from(int contact_from_){ contact_from = contact_from_; }
	void set_address(string address_){ address = address_; }
	void set_primary_phone(string primary_phone_){ primary_phone = primary_phone_; }
	void set_alt_phone(string alt_phone_){ alt_phone = alt_phone_; }
	void set_mobile_phone(string mobile_phone_){ mobile_phone = mobile_phone_; }
	void set_fax(string fax_){ fax = fax_; }
	void set_email(string email_){ email = email_; }
	void set_twitter(string twitter_){ twitter = twitter_; }
	void set_linkedin(string linkedin_){ linkedin = linkedin_; }
	void set_facebook(string facebook_){ facebook = facebook_; }
	void set_job_title(string job_title_){ job_title = job_title_; }
	void set_company_id(int company_id_){ company_id = company_id_; }
	void set_when_met(string when_met_){ when_met = when_met_; }
	void set_where_met(string where_met_){ where_met = where_met_; }
	void set_time_zone(string time_zone_){ time_zone = time_zone_; }
	void set_main_contact(int main_contact_){ main_contact = main_contact_; }
	void set_out_of_marketing(int out_of_marketing_){ out_of_marketing = out_of_marketing_; }
	void set_out_of_billing(int out_of_billing_){ out_of_billing = out_of_billing_; }
	void set_extra_info(string extra_info_){ extra_info = extra_info_; }

private:
	int contact_id;
	int status;
	string firstName;
	string lastName;
	int contact_from;
	string address;
	string primary_phone;
	string alt_phone;
	string mobile_phone;
	string fax;
	string email;
	string twitter;
	string linkedin;
	string facebook;
	string job_title;
	int company_id;
	string when_met;
	string where_met;
	string time_zone;
	int main_contact;
	int out_of_marketing;
	int out_of_billing;
	string extra_info;
};

