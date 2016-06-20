#pragma once


class InputFieldFactory final
{
public:
	InputFieldFactory() = default;

	~InputFieldFactory() = default;

public:
	enum ID { ADDRESS_INPUT, RADIUS_INPUT, STARTDATE_INPUT, ENDDATE_INPUT, CATEGORY_INPUT, };
	static UserInput *CreateRaw(ID id);
	static unique_ptr<UserInput> CreateUnique(ID id);
	static shared_ptr<UserInput> CreateShared(ID id);
};

class VerifierFactory final
{
};

class DisplayFactory final
{
public:
	static unique_ptr<View> CreateUnique(string name);
};

class ClientDataFactory final
{
public:
	static shared_ptr<CurlClient> CreateShared(string name);
};
/*
AddressInput.hpp  CategoryInput.hpp  EndDateInput.hpp       InputValidityChecker.hpp  RadiusInput.hpp     UserInput.hpp
App.hpp           CurlClient.hpp     InputEmptyChecker.hpp  InputVerifier.hpp         StartDateInput.hpp  View.hpp
[2]+  Done                    gedit InstanceFactory.h InstanceFactory.cpp
*/


