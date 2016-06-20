

#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "GeoCoder.hpp"

GeoCoder::GeoCoder() = default;
GeoCoder::~GeoCoder() = default;

/*  resolve address and get json info, this is just for verify the address is recognizable. Eventful API can use the original address to search 
location=address&&within=25&units=km&date=YYYYMMDD00-YYYYMMDD00&category=music


address
{
SUITE 5A-1204
   799 E DRAGRAM
   TUCSON AZ 85705
   USA
request:
https://maps.googleapis.com/maps/api/geocode/json?address=SUITE 5A-1024 799 E DRAGRAM TUCSON AZ 85705 USA&key=AIzaSyAxfX17W_5BTsRPOPd0jL2fUjOv2yEVz2c
https://maps.googleapis.com/maps/api/geocode/json?address=SUITE 5A-1024 799 E DRAGRAM TUCSON AZ 85705 USA&key=AIzaSyAxfX17W_5BTsRPOPd0jL2fUjOv2yEVz2c
}

*/
bool GeoCoder::Resolve(std::string addr)
{
try
    {
        std::stringstream ss;
        ss << addr;


        boost::property_tree::ptree pt;
        boost::property_tree::read_json(ss, pt);

	auto val = pt.get<std::string>("status");
	if(val == "OK")
        	return true;
    }
    catch (std::exception const& e)
    {
        std::cerr << e.what() << std::endl;
	return false;
    }
	return false;
}

//To access the Google Maps Geocoding API over HTTP, use:
//http://maps.googleapis.com/maps/api/geocode/outputFormat?parameters
//As is standard in URLs, parameters are separated using the ampersand (&) character.


//Required parameters in a geocoding request:
//	address — The street address that you want to geocode, in the format used by the national postal service of the country concerned. 
//	key — Your application's API key. 

