
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9

#include "shrest_utils.h"

using namespace std;

void utils::parse_kye_value(std::string content, std::map<std::string, std::string> &m){

   	boost::regex re("([^=&]+)=([^&]+)");        // Create the reg exp
   	boost::sregex_iterator pos(content.begin(), content.end(), re);
      	boost::sregex_iterator end;
	
	stringstream cs;
	for ( ; pos!=end ; ++pos ) {
		m[pos->str(1)] = pos->str(2);
	}
}