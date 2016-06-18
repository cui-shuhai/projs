
#include "CurlClient.hpp"
 
 
int main(int argc, const char **argv) {
     
	string url{"http://eventful.com/events?q=music&l=San+Diego&t=This+Weekend"};
	CurlClient  client;

	string content;

	client.Request(url);

	cout << client.GetContent() << endl;
}

	
   
