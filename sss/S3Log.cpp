
#include "S3Log.h"

S3Log::S3Log(){
}


/*
template<typename T>
S3Log& S3Log::operator <<(T data)
{
    //_out_stream << data;
    std::cout << data;
    return *this;
}
*/

bool S3Log::SetLogFile(std::string logFile)
{
    return true;
}

void S3Log::Flush()
{

}

S3Log::~S3Log()
{

}
