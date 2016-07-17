
#pragma once
/* Standard C++ includes */
#include <stdlib.h>
#include <iostream>

#include "mysqlcpp.h"

using namespace std;
class Customer : public Msqlcpp{

public:
	Customer();
	Customer(int id, string firstName, string lastName, int age, string phone, string address);
	~Customer();
	
	void AddCustomer();

private:
	int id_;
	string firstName_; 
	string lastName_; 
	int age_; 
	string phone_; 
	string address_;
};

