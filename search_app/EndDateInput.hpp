#pragma once

#include "UserInput.hpp"


#include "boost/date_time/gregorian/gregorian.hpp"

using namespace boost::gregorian;

class EndDateInput : public UserInput
{
public:
	EndDateInput();
	~EndDateInput();

public:
	bool Accept(shared_ptr<InputVerifier> verifier)const override;

	date GetEndDate() const { return endDate;}

	void SetEndDate(const date rhs){ endDate = rhs; }

private:
	date endDate = boost::gregorian::day_clock::local_day() + date_duration(1);
};
