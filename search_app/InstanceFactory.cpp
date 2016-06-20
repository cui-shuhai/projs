#include <exception>
#include <iostream>

using namespace std;

#include "CurlClient.hpp"
#include "InputVerifier.hpp"
#include "AddressInput.hpp"
#include "RadiusInput.hpp"
#include "StartDateInput.hpp"
#include "EndDateInput.hpp"
#include "CategoryInput.hpp"
#include "View.hpp"
#include "InstanceFactory.hpp"



//	enum ID { AddressInput, RadiusInput, StartDateInput, EedDateInput, CategoryInput, };

UserInput * InputFieldFactory::CreateRaw(InputFieldFactory::ID id)
{
	try
	{
		switch(id)
		{
			case InputFieldFactory::ADDRESS_INPUT:
				return new AddressInput{};
			case InputFieldFactory::RADIUS_INPUT:
				return new RadiusInput;
			case InputFieldFactory::STARTDATE_INPUT:
				return new StartDateInput;
			case InputFieldFactory::ENDDATE_INPUT:
				return new EndDateInput;
			case InputFieldFactory::CATEGORY_INPUT:
				return new CategoryInput;
			default:
				return nullptr;

		}	
		
	}
	catch(std::bad_alloc &e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
	catch(std::exception e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
}

unique_ptr<UserInput> InputFieldFactory::CreateUnique(ID id)
{
	try
	{
		switch(id)
		{
			case InputFieldFactory::ADDRESS_INPUT:
				return unique_ptr<AddressInput>(new AddressInput);
			case InputFieldFactory::RADIUS_INPUT:
				return unique_ptr<RadiusInput>(new RadiusInput);
			case InputFieldFactory::STARTDATE_INPUT:
				return unique_ptr<StartDateInput>(new StartDateInput);
			case InputFieldFactory::ENDDATE_INPUT:
				return unique_ptr<EndDateInput>(new EndDateInput);
			case InputFieldFactory::CATEGORY_INPUT:
				return unique_ptr<CategoryInput>(new CategoryInput);
			default:
				return nullptr;

		}	
		
	}
	catch(std::bad_alloc &e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
	catch(std::exception e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
}

shared_ptr<UserInput> InputFieldFactory::CreateShared(ID id)
{
	try
	{
		switch(id)
		{
		
			case InputFieldFactory::ADDRESS_INPUT:
				return make_shared<AddressInput>();
			case InputFieldFactory::RADIUS_INPUT:
				return make_shared<RadiusInput>();
			case InputFieldFactory::STARTDATE_INPUT:
				return make_shared<StartDateInput>();
			case InputFieldFactory::ENDDATE_INPUT:
				return make_shared<EndDateInput>();
			case InputFieldFactory::CATEGORY_INPUT:
				return make_shared<CategoryInput>();
			default:
				return nullptr;

		}	
		
	}
	catch(std::bad_alloc &e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
	catch(std::exception e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
}


unique_ptr<View> DisplayFactory::CreateUnique(string name)
{
	try
	{
		if(name == "View")
		{
			return unique_ptr<View>(new View);
		}
		return nullptr;		
	}
	catch(std::bad_alloc &e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
	catch(std::exception e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
}

shared_ptr<CurlClient> ClientDataFactory::CreateShared(string name)
{
	try
	{
		if(name == "CurlClient")
		{
			return make_shared<CurlClient>();
		}
		return nullptr;		
	}
	catch(std::bad_alloc &e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
	catch(std::exception e)
	{
		cout << e.what() << endl;
		return nullptr;
	}
}


