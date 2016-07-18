

#include <iostream>
#include <fstream>
#include <boost/filesystem.hpp>

#include "NLTemplate.h"
#include "IcrmIndex.h"



using namespace std;
using namespace NL::Template;


IcrmIndex::IcrmIndex(HttpServer::Response &rs, ShRequest rq): RequestResponse(rs, rq){
}
IcrmIndex::~IcrmIndex(){}

void IcrmIndex::Process(){
     try {

        	stringstream content_stream;
		LoaderFile loader; // Let's use the default loader that loads files from disk.

		Template t( loader );

		t.load( "web/test.html" );
           
		t.set( "text", "Hello, world" ); 

		t.render( content_stream ); // Render the template with the variables we've set above
 
		//find length of content_stream (length received using content_stream.tellp())
		
		content_stream.seekp(0, ios::end);
		rs_ <<  content_stream.rdbuf();
		rs_.flush();
    }
    catch(exception& e) {
        rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << strlen(e.what()) << "\r\n\r\n" << e.what();
    }
/*
     const auto web_root_path=boost::filesystem::canonical("web");
        boost::filesystem::path path=web_root_path;
        path/=rq_->path;
        if(boost::filesystem::exists(path)) {
            path=boost::filesystem::canonical(path);
            //Check if path is within web_root_path
            if(distance(web_root_path.begin(), web_root_path.end())<=distance(path.begin(), path.end()) &&
               equal(web_root_path.begin(), web_root_path.end(), path.begin())) {
                if(boost::filesystem::is_directory(path))
                    path/="index.html";
                if(boost::filesystem::exists(path) && boost::filesystem::is_regular_file(path)) {
                    ifstream ifs;
                    ifs.open(path.string(), ifstream::in | ios::binary);
                    
                    if(ifs) {
                        ifs.seekg(0, ios::end);
                        auto length=ifs.tellg();
                        
                        ifs.seekg(0, ios::beg);
                        
                        rs_ << "HTTP/1.1 200 OK\r\nContent-Length: " << length << "\r\n\r\n";
                        
                        //read and send 128 KB at a time
                        const size_t buffer_size=131072;
                        vector<char> buffer(buffer_size);
                        streamsize read_length;
                        try {
                            while((read_length=ifs.read(&buffer[0], buffer_size).gcount())>0) {
                                rs_.write(&buffer[0], read_length);
                                rs_.flush();
                            }
                        }
                        catch(const exception &) {
                            cerr << "Connection interrupted, closing file" << endl;
                        }

                        ifs.close();
                        return;
                    }
                }
            }
        }
        string content="Could not open path "+rq_->path;
        rs_ << "HTTP/1.1 400 Bad Request\r\nContent-Length: " << content.length() << "\r\n\r\n" << content;
*/
}
