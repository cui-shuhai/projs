
#pragma once
#include <map>
#include <string>

using namespace std;

class utils{
public:
	utils() = default;
	~utils() = default;

public:
	static void parse_kye_value(std::string& content, std::map<std::string, std::string> &m);
	static void parse_get_params(std::string& content, std::map<std::string, std::string> &m);
	static void build_json(std::map<std::string, std::string> &m, std::string &result);
	static void build_json(std::map<int , std::string> &m, std::string &result);
	static void build_json(std::vector< std::string> &m, string &result);
	static void build_raw_response(string &content);
	static std::string create_uuid();
	static std::string get_date();
};

