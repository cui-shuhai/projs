
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class opportunity_table : public SqlAccessor{

public:
	opportunity_table();
	opportunity_table( int opportunity_, string opportunity_name_, int assign_to_, int contact_id_, int creator_id_, string close_date_, int pipeline_, double amount_, int probablity_);
	~opportunity_table();
	
	void add_opportunity_table();
	int get_opportunity_tableId();

	int get_opportunity(){ return opportunity; }
	string get_opportunity_name(){ return opportunity_name; }
	int get_assign_to(){ return assign_to; }
	int get_contact_id(){ return contact_id; }
	int get_creator_id(){ return creator_id; }
	string get_close_date(){ return close_date; }
	int get_pipeline(){ return pipeline; }
	double get_amount(){ return amount; }
	int get_probablity(){ return probablity; }

	void set_opportunity(int opportunity_){ opportunity = opportunity_; }
	void set_opportunity_name(string opportunity_name_){ opportunity_name = opportunity_name_; }
	void set_assign_to(int assign_to_){ assign_to = assign_to_; }
	void set_contact_id(int contact_id_){ contact_id = contact_id_; }
	void set_creator_id(int creator_id_){ creator_id = creator_id_; }
	void set_close_date(string close_date_){ close_date = close_date_; }
	void set_pipeline(int pipeline_){ pipeline = pipeline_; }
	void set_amount(double amount_){ amount = amount_; }
	void set_probablity(int probablity_){ probablity = probablity_; }
private:
	int opportunity;
	string opportunity_name;
	int assign_to;
	int contact_id;
	int creator_id;
	string close_date;
	int pipeline;
	double amount;
	int probablity;
};
