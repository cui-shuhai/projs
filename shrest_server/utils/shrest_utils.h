
#pragma once
#include <map>
#include <string>


class utils{
public:
	utils() = default;
	~utils() = default;

public:
	static void parse_kye_value(std::string content, std::map<std::string, std::string> &m);
	static void parse_get_params(std::string content, std::map<std::string, std::string> &m);
	static std::string create_uuid();
	static std::string get_date();
};

