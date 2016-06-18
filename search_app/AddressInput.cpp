
#include "InputEmptyChecker.hpp"
#include "InputValidityChecker.hpp"
#include "AddressInput.hpp"


AddressInput::AddressInput():UserInput(), address{}
{}


bool AddressInput::Accept(shared_ptr<InputVerifier> verifier)const
{
	verifier->Validate(*this);
}

