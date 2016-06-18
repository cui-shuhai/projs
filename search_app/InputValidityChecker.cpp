
#include "InputValidityChecker.hpp"
#include "AddressInput.hpp"
#include "CategoryInput.hpp"
#include "EndDateInput.hpp"
#include "StartDateInput.hpp"
#include "RadiusInput.hpp"

bool InputValidityChecker::Validate(const AddressInput &input)
{
	//using geoAPI check
}

bool InputValidityChecker::Validate(const RadiusInput &input)
{
	auto v = input.GetRadius();

	return  v >= 0 && v <= 300.0;
}

bool InputValidityChecker::Validate(const StartDateInput &input)
{
	auto d = input.GetStartDate();
}

bool InputValidityChecker::Validate(const EndDateInput &input)
{
	auto d = input.GetEndDate();
}

bool InputValidityChecker::Validate(const CategoryInput &input)
{
	auto v = input.GetCategory();
	return  v <= EventCategory::PERFORMING_ARTS && v >= EventCategory::MUSIC_EVENT;
}

/*
int main()
{
  boost::gregorian::date d{2014, 1, 31};
  std::cout << d.year() << '\n';
  std::cout << d.month() << '\n';
  std::cout << d.day() << '\n';
  std::cout << d.day_of_week() << '\n';
  std::cout << d.end_of_month() << '\n';
}

#include <boost/date_time/gregorian/gregorian.hpp>
#include <iostream>

using namespace boost::gregorian;

int main()
{
  date d = day_clock::universal_day();
  std::cout << d.year() << '\n';
  std::cout << d.month() << '\n';
  std::cout << d.day() << '\n';

  d = date_from_iso_string("20140131");
  std::cout << d.year() << '\n';
  std::cout << d.month() << '\n';
  std::cout << d.day() << '\n';
}
*/
