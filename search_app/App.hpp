#pragma once

#include <memory>
#include <vector>

class UserInput;
class View;

/** The frame of the application */

class App
{
public:
	App();
	~App();

public:
	std::vector<std::shared_ptr<UserInput>>& GetInputFields()
	{
		return inputFields;
	}
	
	void PushInputField(std::shared_ptr<UserInput>);
	
	std::shared_ptr<CurlClient>& GetData()
	{ return data;}
	
	void SetData(std::shared_ptr<CurlClient>& d);

	void SetSearch(std::string s) { search = s;}
	const std::string GetSearch() { return search; }

	void SetDisplay(std::unique_ptr<View> & d);

	void SetAddCalander(std::string s) { add_to_calander = s;}
	const std::string GetAddCalander() { return add_to_calander; }


	void Run();

private:
	std::vector<std::shared_ptr<UserInput>> inputFields;
	std::shared_ptr<CurlClient> data;
	std::string search = "Search: disabled";
	std::unique_ptr<View> display;
	std::string add_to_calander = "Add to Calender";	
};

