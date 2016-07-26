
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class company_table : public SqlAccessor{

public:
	company_table();
	company_table(string id);
	company_table( string company_id, string name, string address, string phone, string fax, string parent_company, string industry_type, string annual_revenue, string currency_id, string credit_limit, string credit_rating, string time_zone, string payment_terms);
	~company_table();
	void add_company_table();

	string get_company_id(){ return company_id;}
	string get_name(){ return name;}
	string get_address(){ return address;}
	string get_phone(){ return phone;}
	string get_fax(){ return fax;}
	string get_parent_company(){ return parent_company;}
	string get_industry_type(){ return industry_type;}
	string get_annual_revenue(){ return annual_revenue;}
	string get_currency_id(){ return currency_id;}
	string get_credit_limit(){ return credit_limit;}
	string get_credit_rating(){ return credit_rating;}
	string get_time_zone(){ return time_zone;}
	string get_payment_terms(){ return payment_terms;}

	void set_company_id(string company_id_){ company_id = company_id_; }
	void set_name(string name_){ name = name_; }
	void set_address(string address_){ address = address_; }
	void set_phone(string phone_){ phone = phone_; }
	void set_fax(string fax_){ fax = fax_; }
	void set_parent_company(string parent_company_){ parent_company = parent_company_; }
	void set_industry_type(string industry_type_){ industry_type = industry_type_; }
	void set_annual_revenue(string annual_revenue_){ annual_revenue = annual_revenue_; }
	void set_currency_id(string currency_id_){ currency_id = currency_id_; }
	void set_credit_limit(string credit_limit_){ credit_limit = credit_limit_; }
	void set_credit_rating(string credit_rating_){ credit_rating = credit_rating_; }
	void set_time_zone(string time_zone_){ time_zone = time_zone_; }
	void set_payment_terms(string payment_terms_){ payment_terms = payment_terms_; }

private:
	string company_id;
	string name;
	string address;
	string phone;
	string fax;
	string parent_company;
	string industry_type;
	string annual_revenue;
	string currency_id;
	string credit_limit;
	string credit_rating;
	string time_zone;
	string payment_terms;
};

