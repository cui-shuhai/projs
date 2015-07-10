
#include "S3Log.h"


S3Log::m_pInstance = nullptr;


S3Log* S3Log::Instance()
{
    //permistically we need to use call once
    if(m_pInstance == nullptr)
        m_pInstance = new S3Log();
    return m_pInstance;
}

template<typename T>
S3Log& S3Log::operator<T> <<(T data)
{
    //_out_stream << data;
    std::cout << data;
    return *this;
}

bool S3Log::SetLogFile(std::string logFile)
{
}

void S3Log::Flush()
{

}

S3Log::~S3Log()
{

}
