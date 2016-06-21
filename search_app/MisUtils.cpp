
#include <regex>
#include <string>

using namespace std;

#include "MisUtils.hpp"


static const std::map<std::string, int> monthsMap
{
        { "Jan", 0 },
        { "Feb", 1 },
        { "Mar", 2 },
        { "Apr", 3 },
        { "May", 4 },
        { "Jun", 5 },
        { "Jul", 6 },
        { "Aug", 7 },
        { "Sep", 8 },
        { "Oct", 9 },
        { "Nov", 10 },
        { "Dec", 11 }
};

vector<string> AppMisUtils::split(const string& str, int delimiter){
	vector<string> result;
  	auto e=str.end();
  	auto i=str.begin();
  	
	while(i!=e){
    		i=find_if_not(i,e, [delimiter](int c){ return c == delimiter;});
    		
	if(i==e) break;
    	auto j=find_if(i,e, [delimiter](int c){ return c == delimiter;});
    	result.push_back(string(i,j));
    		i=j;
  	}
  	return result;
}


bool AppMisUtils::str_to_date(const string& str, date &d)
{
	if( str[2] != '/' && str[5] != '/' && str.length() != 10)
		return false;

	try
	{
		auto dd = stoi(str.substr(0,2));
		auto mm = stoi(str.substr(3,2));
		auto yy = stoi(str.substr(6,4));
		date d = date(yy, mm, dd);
		return true;
	}
	catch( const std::exception& e )
	{
	    std::cerr << "*** error: " << e.what() << '\n' ;
		return false;
	}
	
	return false;
}

string AppMisUtils::date_to_str(date &dt)
{
	std::ostringstream os;
	if(dt.day() < 10)
	os << "0";
	os << dt.day() << "/";
	if(dt.month() < 10)
	os << "0";
	os << dt.month() << "/" << dt.year();
	return os.str();
}

string AppMisUtils::date_to_str2(date &dt)
{
	auto mth = dt.month().as_number();
	std::ostringstream os;
	if(dt.day() < 10)
	os << "0";
	os << dt.day() << "/";
		
	if( mth < 10)
	os << "0";
	os << mth << "/" << dt.year();
	return os.str();
}


