
#include <sstream>
#include "CurlClient.hpp"



CurlClient::CurlClient():curl{nullptr}
{
	Init_Curl();
	data.clear();
}

CurlClient::~CurlClient()
{
	curl_easy_cleanup(curl);
    	curl_global_cleanup();
}


void CurlClient::Init_Curl()
{
    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
}


size_t CurlClient::WriteData(void* buf, size_t size, size_t nmemb, void* userp)
{
  if(userp)
	{
		std::ostream& os = *static_cast<std::ostream*>(userp);
		std::streamsize len = size * nmemb;
		if(os.write(static_cast<char*>(buf), len))
			return len;
	}

	return 0;
}

CURLcode CurlClient::Request(string url,  long timeout)
{
	CURLcode code(CURLE_FAILED_INIT);
	std::ostringstream oss;
	std::ostream& os = oss;

	if(curl)
	{
		if(CURLE_OK == (code = curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, &WriteData))
		&& CURLE_OK == (code = curl_easy_setopt(curl, CURLOPT_NOPROGRESS, 1L))
		&& CURLE_OK == (code = curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L))
		&& CURLE_OK == (code = curl_easy_setopt(curl, CURLOPT_FILE, &os))
		&& CURLE_OK == (code = curl_easy_setopt(curl, CURLOPT_TIMEOUT, timeout))
		&& CURLE_OK == (code = curl_easy_setopt(curl, CURLOPT_URL, url.c_str())))
		{
			code = curl_easy_perform(curl);
			data = oss.str();
		}
	}
	return code;
}


