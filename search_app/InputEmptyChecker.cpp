#include <regex>


#include "InputEmptyChecker.hpp"

#include "AddressInput.hpp"
#include "CategoryInput.hpp"
#include "EndDateInput.hpp"
#include "StartDateInput.hpp"
#include "RadiusInput.hpp"


bool InputEemptyChecker::Validate(const AddressInput &input)
{
	const string & address = input.GetAddress();
	regex reg(R"([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n?)");
	smatch match;
	if(regex_match(address, match, reg))
	{
		for (std::smatch::iterator it = match.begin(); it!=match.end(); ++it)
		{
	 		if(it->str().empty())
			return false;
  		}
	}
	return true;
}

bool InputEemptyChecker::Validate(const RadiusInput &input)
{	//cann't be empty
	return true;
}

bool InputEemptyChecker::Validate(const StartDateInput &input)
{
	//startup default, cann't be empty
	return true;	
}

bool InputEemptyChecker::Validate(const EndDateInput &input)
{
	//ditto
	return true;
}

bool InputEemptyChecker::Validate(const CategoryInput &input)
{
	//default allowed and only legal options
	return true;
}


