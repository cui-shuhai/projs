#pragma once

#include "InputVerifier.hpp"


class InputEemptyChecker : InputVerifier 
{
public:
	InputEemptyChecker() = default;
	~InputEemptyChecker() = default;

public:
	bool Validate(const AddressInput &input) override;
	bool Validate(const RadiusInput &input) override;
	bool Validate(const StartDateInput &input) override;
	bool Validate(const EndDateInput &input) override;
	bool Validate(const CategoryInput &input) override;
};

