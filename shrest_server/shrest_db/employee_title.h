
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>
#include <map>

#include "SqlAccessor.h"

using namespace std;
class employee_title : public SqlAccessor{

public:
	employee_title();
	employee_title(int title_id, string name, string description);
	~employee_title();
	
	void add_employee_title();
	void get_employee_titles( map<int, string> &m);

private:
	int title_id;
	string name;
	string description;
};
