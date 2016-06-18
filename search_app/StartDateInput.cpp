
#include "InputEmptyChecker.hpp"
#include "InputValidityChecker.hpp"
#include "StartDateInput.hpp"



StartDateInput::StartDateInput()
{
}

StartDateInput::~StartDateInput()
{
}


bool StartDateInput::Accept(shared_ptr<InputVerifier> verifier)const
{
	verifier->Validate(*this);
}

