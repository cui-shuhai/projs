#pragma once

#include <string>

class GeoCoder
{
public:
	GeoCoder();
	~GeoCoder();
	bool Resolve(std::string addr);
private:
	std::string address;
};
