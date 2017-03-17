
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class opportunity_table : public SqlAccessor{

public:
	opportunity_table();
	opportunity_table( string opportunity_id_, string opportunity_name_, string assign_to_, string contact_id_, string creator_id_, string close_date_, string pipeline_, double amount_, string probablity_);
	~opportunity_table();
	
	void add_opportunity_table();
	void update_opportunity_table();
	void get_opportunity_instance(std::map<string, string> &opportunity);
	void get_opportunity_records( string source, string &result );
	void get_opportunity_pipelines(std::vector<string> &m);

	string get_opportunity_id(){ return opportunity_id; }
	string get_opportunity_name(){ return opportunity_name; }
	string get_assign_to(){ return assign_to; }
	string get_contact_id(){ return contact_id; }
	string get_creator_id(){ return creator_id; }
	string get_close_date(){ return close_date; }
	string get_pipeline(){ return pipeline; }
	double get_amount(){ return amount; }
	string get_probablity(){ return probablity; }

	void set_opportunity_id(string opportunity_id_){ opportunity_id = opportunity_id_; }
	void set_opportunity_name(string opportunity_name_){ opportunity_name = opportunity_name_; }
	void set_assign_to(string assign_to_){ assign_to = assign_to_; }
	void set_contact_id(string contact_id_){ contact_id = contact_id_; }
	void set_creator_id(string creator_id_){ creator_id = creator_id_; }
	void set_close_date(string close_date_){ close_date = close_date_; }
	void set_pipeline(string pipeline_){ pipeline = pipeline_; }
	void set_amount(double amount_){ amount = amount_; }
	void set_probablity(string probablity_){ probablity = probablity_; }
private:
	string opportunity_id;
	string opportunity_name;
	string assign_to;
	string contact_id;
	string creator_id;
	string close_date;
	string pipeline;
	double amount;
	string probablity;
};
