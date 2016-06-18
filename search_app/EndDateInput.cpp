

#include "InputEmptyChecker.hpp"
#include "InputValidityChecker.hpp"
#include "EndDateInput.hpp"



EndDateInput::EndDateInput()
{
}

EndDateInput::~EndDateInput()
{
}


bool EndDateInput::Accept(shared_ptr<InputVerifier> verifier)const
{
	verifier->Validate(*this); 
}

