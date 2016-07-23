


#define BOOST_SPIRIT_THREADSAFE
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

#include "NLTemplate/NLTemplate.h"
#include "lead_table.h"
#include "AddLeadInterface.h"

using namespace std;
using namespace NL::Template;

using namespace boost::property_tree;

AddLeadInterface::AddLeadInterface(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}

void AddLeadInterface::Process(){
     try {

        	stringstream content_stream;
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/addleadinterface.html" );
		t.block("meat").repeat(1); 
		lead_table lt;
           
		{
			Block & block = t.block( "meat" )[ 0 ].block( "lead_source" );
			std::map<int, string> sources;

			lt.get_lead_source(sources);
			auto rows = sources.size();
			block.repeat(rows);
			int i = 0;
			for(const auto &v : sources){
				block[i].set("lead_source_value", to_string(v.first));
				block[i].set("lead_source_show", v.second);
			}
		}
		{
			Block & block = t.block( "meat" )[ 0 ].block( "lead_status" );
			std::map<int, string> statuss;

			lt.get_lead_status(statuss);
			auto rows = statuss.size();
			block.repeat(rows);
			int i = 0;
			for(const auto &v : statuss){
				block[i].set("lead_status_value", to_string(v.first));
				block[i].set("lead_status_show", v.second);
			}
		}
		{
			Block & block = t.block( "meat" )[ 0 ].block( "lead_rating" );
			std::map<int, string> ratings;

			lt.get_lead_rating(ratings);
			auto rows = ratings.size();
			block.repeat(rows);
			int i = 0;
			for(const auto &v : ratings){
				block[i].set("lead_rating_value", to_string(v.first));
				block[i].set("lead_rating_show", v.second);
			}
		}

		t.render( content_stream ); // Render the template with the variables we've set above
 
		//find length of content_stream (length received using content_stream.tellp())
		
		content_stream.seekp(0, ios::end);
		rs_ <<  content_stream.rdbuf();
		rs_.flush();
    }
    catch(exception& e) {
        rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
    }
}
