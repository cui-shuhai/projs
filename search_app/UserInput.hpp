
#pragma once

#include <memory>

using namespace std;

class UserInput
{
public:
	bool IsFocused()
	{ return isFocused; }

	void SetFocused(bool flag)
	{ isFocused = flag; }

	virtual bool Accept(shared_ptr<InputVerifier> verifier)const = 0;

protected:
	UserInput():isFocused{false}{}

	virtual ~UserInput() = default;
	
	
private:
	bool isFocused;
};
