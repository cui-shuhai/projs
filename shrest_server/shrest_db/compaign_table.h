
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class compaign_table : public SqlAccessor{

public:
	compaign_table();
	compaign_table(int id);
	compaign_table( int compaign_id_, string compaign_name_, int assign_to_, string status_, int creator_id_, string start_date_, string close_date_, string description_);
	~compaign_table();
	
	int get_compaign_id(){ return compaign_id; }
	string get_compaign_name(){ return compaign_name; }
	int get_assign_to(){ return assign_to; }
	string get_status(){ return status; }
	int get_creator_id(){ return creator_id; }
	string get_start_date(){ return start_date; }
	string get_close_date(){ return close_date; }
	string get_description(){ return description; }

	void set_compaign_id(int compaign_id_){ compaign_id = compaign_id_; }
	void set_compaign_name(string compaign_name_){ compaign_name = compaign_name_; }
	void set_assign_to(int assign_to_){ assign_to = assign_to_; }
	void set_status(string status_){ status = status_; }
	void set_creator_id(int creator_id_){ creator_id = creator_id_; }
	void set_start_date(string start_date_){ start_date = start_date_; }
	void set_close_date(string close_date_){ close_date = close_date_; }
	void set_description(string description_){ description = description_; }

	void add_compaign_table();

private:
	int compaign_id;
	string compaign_name;
	int assign_to;
	string status;
	int creator_id;
	string start_date;
	string close_date;
	string description;
};

