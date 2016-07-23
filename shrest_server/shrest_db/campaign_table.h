
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class campaign_table : public SqlAccessor{

public:
	campaign_table();
	campaign_table(int id);
	campaign_table( int campaign_id_, string campaign_name_, int assign_to_, string status_, int creator_id_, string start_date_, string close_date_, string description_);
	~campaign_table();
	
	int get_campaign_id(){ return campaign_id; }
	string get_campaign_name(){ return campaign_name; }
	int get_assign_to(){ return assign_to; }
	string get_status(){ return status; }
	int get_creator_id(){ return creator_id; }
	string get_start_date(){ return start_date; }
	string get_close_date(){ return close_date; }
	string get_description(){ return description; }

	void set_campaign_id(int campaign_id_){ campaign_id = campaign_id_; }
	void set_campaign_name(string campaign_name_){ campaign_name = campaign_name_; }
	void set_assign_to(int assign_to_){ assign_to = assign_to_; }
	void set_status(string status_){ status = status_; }
	void set_creator_id(int creator_id_){ creator_id = creator_id_; }
	void set_start_date(string start_date_){ start_date = start_date_; }
	void set_close_date(string close_date_){ close_date = close_date_; }
	void set_description(string description_){ description = description_; }

	void add_campaign_table();

private:
	int campaign_id;
	string campaign_name;
	int assign_to;
	string status;
	int creator_id;
	string start_date;
	string close_date;
	string description;
};

