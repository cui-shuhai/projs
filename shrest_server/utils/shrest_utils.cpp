
#include <boost/regex.hpp>//g++4.8 regex implementation has some errors but fixed fin 4.9
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/random_generator.hpp>
#include <boost/lexical_cast.hpp>
#include <ctime>   // localtime
#include <sstream> // stringstream
#include <string>  // string

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


//$1 = "/listcontact/contact_content?from_id=lead"
void utils::parse_get_params(std::string content, std::map<std::string, std::string> &m){

   	boost::regex re("([^=&?]+)=([^&]+)");        // Create the reg exp
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

std::string utils::get_date(){



	time_t t = time(0);   // get time now
	struct tm * now = localtime( & t );
	
	ostringstream os;
	os << now->tm_year + 1900 <<"/"<< now->tm_mon + 1 << "/" << now->tm_mday;
	string date = os.str();
	return date;
}

void utils::build_json(std::map<std::string, std::string> &m, string &result)
{
	stringstream ss;

	bool first = true;
	ss << "{ \"recordset\":[ ";
	for( const auto &v : m ){
		if(first)
			first = false;
		else{
			ss << ", ";
		}
		ss << "{" ;
		ss << "\"key\"" <<  ":" << "\"" << v.first << "\""  << ", "; 
		ss << "\"value\"" << ":" << "\"" << v.second << "\"" ; 
		ss << "}";
	} 
	ss << " ] }";
	result = ss.str();

}

void utils::build_json(std::vector< std::string> &m, string &result)
{
	stringstream ss;

	bool first = true;
	ss << "{ \"recordset\":[ ";
	for( const auto &v : m ){
		if(first)
			first = false;
		else{
			ss << ", ";
		}
		ss << "\"" << v << "\"" ; 
	} 
	ss << " ] }";
	result = ss.str();

}

void utils::build_raw_response(string &content){

	stringstream ss;

	if(content.length() == 0)
	ss << "HTTP/1.1 200 OK\r\n" << "Content-Type: application/javascript"  << "\r\n" << "Content-Length: " << content.length() << "\r\n\r\n" ;
	else
	ss << "HTTP/1.1 200 OK\r\n" << "Content-Type: application/javascript"  << "\r\n" << "Content-Length: " << content.length() << "\r\n\r\n" << content;
	content = ss.str();
}

void utils::build_json(std::map<int , std::string> &m, string &result)
{
	stringstream ss;

	bool first = true;
	ss << "{ \"recordset\":[ ";
	for( const auto &v : m ){
		if(first)
			first = false;
		else{
			ss << ", ";
		}
		ss << "{" ;
		ss << "\"key\"" <<  ":" << "\"" << v.first << "\"" << ", " ; 
		ss << "\"value\"" << ":" << "\"" << v.second << "\"" ; 
		ss << "}";
	} 
	ss << " ] }";
	result = ss.str();
}

