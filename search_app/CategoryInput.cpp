
#include <memory>

#include "InputEmptyChecker.hpp"
#include "InputValidityChecker.hpp"
#include "CategoryInput.hpp"

using namespace std;

CategoryInput::CategoryInput():category{EventCategory::MUSIC_EVENT}{};

bool CategoryInput::Accept(shared_ptr<InputVerifier> verifier) const
{
	verifier->Validate(*this);
}
