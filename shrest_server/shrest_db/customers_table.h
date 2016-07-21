
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "SqlAccessor.h"

using namespace std;
class Customer : public SqlAccessor{

public:
	Customer();
	Customer(int id, string firstName, string lastName, int age, string phone, string address);
	~Customer();
	
	void AddCustomer();
	int GetCustomerId();

private:
	int id_;
	string firstName_; 
	string lastName_; 
	int age_; 
	string phone_; 
	string address_;
};

