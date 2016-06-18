#pragma once

#include "UserInput.hpp"

class RadiusInput : public UserInput
{
public:
	RadiusInput();
	~RadiusInput();

public:
	bool Accept(shared_ptr<InputVerifier> verifier)const override;

	float GetRadius() const { return radius;}

	void SetStreet(const float rhs){ radius = rhs; }

private:
	float radius = 1.0;
};
