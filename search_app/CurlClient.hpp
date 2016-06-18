#pragma once

#include <iostream>
#include <string>
#include <curl/curl.h> 

using namespace std;

class CurlClient
{
public:
	CurlClient();
	CurlClient(const CurlClient &rhs) = delete;
	void Init_Curl();
	CURLcode Request(string url,  long timeout = 30);
	string & GetContent()
	{ return data; }

	~CurlClient();
	

private:
	CURL* curl;
	string data;

public:
	static size_t WriteData(void* buf, size_t size, size_t nmemb, void* userp);

};



