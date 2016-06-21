
#pragma once
#include "boost/date_time/gregorian/gregorian.hpp"
//#include <boost/date_time/gregorian/greg_date.hpp>


using namespace boost::gregorian;
#include <vector>
#include <string>
#include <algorithm>

using namespace std;


struct AppMisUtils{

static vector<string> split(const string& str, int delimiter = '|');

//converts dd/mm/yyyy format string to boost date
static bool str_to_date(const string& str, date &);
static string date_to_str(date &dt);
static string date_to_str2(date &dt);

};

