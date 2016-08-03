
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class campaign_table : public SqlAccessor{

public:
	campaign_table();
	campaign_table(string id);
	campaign_table( string campaign_id_, string campaign_name_, string assign_to_, string campaign_status_, string creator_id_, string start_date_, string close_date_, string description_);
	~campaign_table();
	
	string get_campaign_id(){ return campaign_id; }
	string get_campaign_name(){ return campaign_name; }
	string get_assign_to(){ return assign_to; }
	string get_campaign_status(){ return campaign_status; }
	string get_creator_id(){ return creator_id; }
	string get_start_date(){ return start_date; }
	string get_close_date(){ return close_date; }
	string get_description(){ return description; }

	void set_campaign_id(string campaign_id_){ campaign_id = campaign_id_; }
	void set_campaign_name(string campaign_name_){ campaign_name = campaign_name_; }
	void set_assign_to(string assign_to_){ assign_to = assign_to_; }
	void set_campaign_status(string campaign_status_){ campaign_status = campaign_status_; }
	void set_creator_id(string creator_id_){ creator_id = creator_id_; }
	void set_start_date(string start_date_){ start_date = start_date_; }
	void set_close_date(string close_date_){ close_date = close_date_; }
	void set_description(string description_){ description = description_; }

	void add_campaign_table();
	void update_campaign_table();
	void get_campaign_instance(std::map<string, string> &campaign);
	void get_campaign_records( string source, string &result );

private:
	string campaign_id;
	string campaign_name;
	string assign_to;
	string campaign_status;
	string creator_id;
	string start_date;
	string close_date;
	string description;
};

