#pragma once

#include "UserInput.hpp"

enum class EventCategory
{
	MUSIC_EVENT,
	SPORTS_EVENT,
	PERFORMING_ARTS,
};

class CategoryInput : public UserInput
{
public:
	CategoryInput();
	~CategoryInput() = default;

public:
	bool Accept(shared_ptr<InputVerifier> verifier)const override;

	EventCategory GetCategory() const { return category;}

	void SetCategory(const EventCategory rhs){ category = rhs; }

private:
	EventCategory category;
};
