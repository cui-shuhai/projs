
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "mysqlite.h"

using namespace std;
class contact_activity_view : public mysqlite{

public:
	typedef struct{
		int id; //cusotomer id
		string firstName;
		string lastName;	
		
	} RECORDSET;

	contact_activity_view();
	~contact_activity_view();
	
	void Addcontact_activity_view();
	int Getcontact_activity_viewId();

private:
	RECORDSET activity;
};

