#pragma once

#include "InputVerifier.hpp"


class InputValidityChecker : InputVerifier 
{
public:
	InputValidityChecker() = default;
	~InputValidityChecker() = default;

public:
	bool Validate(const AddressInput &input) override;
	bool Validate(const RadiusInput &input) override;
	bool Validate(const StartDateInput &input) override;
	bool Validate(const EndDateInput &input) override;
	bool Validate(const CategoryInput &input) override;
};

