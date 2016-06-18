#pragma once

#include "UserInput.hpp"

#include "boost/date_time/gregorian/gregorian.hpp"


using namespace boost::gregorian;


class StartDateInput : public UserInput
{
public:
	StartDateInput();
	~StartDateInput();

public:
	bool Accept(shared_ptr<InputVerifier> verifier)const override;

	date GetStartDate() const { return startDate;}

	void SetStartDate(const date rhs){ startDate = rhs; }

private:
	date startDate = boost::gregorian::day_clock::local_day();
};
