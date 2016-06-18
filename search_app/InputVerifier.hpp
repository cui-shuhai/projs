#pragma once

class AddressInput;
class RadiusInput;
class StartDateInput;
class EndDateInput;
class CategoryInput;

class InputVerifier
{
public:
	InputVerifier();
	virtual ~InputVerifier();

public:
	virtual bool Validate(const AddressInput &input) = 0;
	virtual bool Validate(const RadiusInput &input) = 0;
	virtual bool Validate(const StartDateInput &input) = 0;
	virtual bool Validate(const EndDateInput &input) = 0;
	virtual bool Validate(const CategoryInput &input) = 0;
};

