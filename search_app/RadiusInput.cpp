

#include "InputEmptyChecker.hpp"
#include "InputValidityChecker.hpp"
#include "RadiusInput.hpp"



RadiusInput::RadiusInput()
{}

RadiusInput::~RadiusInput()
{}

bool RadiusInput::Accept(shared_ptr<InputVerifier> verifier)const
{
	verifier->Validate(*this);
}

