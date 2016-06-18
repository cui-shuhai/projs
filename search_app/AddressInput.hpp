#pragma once

#include <memory>
#include <string>

#include "UserInput.hpp"

using namespace std;

class AddressInput : public UserInput
{
public:
	AddressInput();
	~AddressInput() = default;

public:
	bool Accept(shared_ptr<InputVerifier> verifier) const override;

	string GetAddress() const { return address;}
/*
	string GetStreet() const { return ;}
	string GetSuite() const { return ;}
	string GetCity() const { return ;}
	string GetZipcode() const { return ;}
	string GetCountry() const { return ;}
*/

	string SetAddress(const string rhs){ address = rhs; }
/*
	string SetStreet(const string rhs){ street = rhs; }
	string SetSuite(const string rhs){ suite = rhs; }
	string SetCity(const string rhs){ city = rhs; }
	string SetZipcode(const string rhs){ zipcode = rhs; }
	string SetCountry(const string rhs){ country = rhs; }
*/	

private:
	string address;
/*
	string street;
	string suite;
	string city;
	string zipcode;
	string country;	
*/
};
