#pragma once

#include <memory>

class View
{
public:
	void AttachData(std::shared_ptr<CurlClient> sd);
	void Display();

public:
	View();
	virtual ~View();

protected:
	std::shared_ptr<CurlClient> data;	
};
