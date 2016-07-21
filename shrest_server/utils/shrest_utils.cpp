
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/random_generator.hpp>
#include <boost/lexical_cast.hpp>

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

string utils::create_uuid(){
	boost::uuids::uuid uuid = boost::uuids::random_generator()();
	std::string as_text = boost::lexical_cast<std::string>(uuid);
	return as_text;
}

/*
boost::regex re("Cookie\\s* ([^=&]+)=([^&]+)", boost::regex::icase);        // Create the reg exp
		boost::smatch what; 
		if (regex_match(content, what, re)){

			string keyid = what[1].str();
			const string key = what[2].str();
			if(keyid == "secret_key"){
				cookie_table ct;
				string user{};
				string password{};
				ct.get_cookie_user(key, user, password);
				CreateDashboard(user, password);
				return;
			}
			else{
				LOG("cookie corrupted\n");
				rs_ << "cookie corrupted, please clear cookie and relogin\n";
				rs_.flush();
				return;
			}
		}		
*/

