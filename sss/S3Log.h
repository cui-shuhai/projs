
#ifndef __S3LOG_H__
#define __S3LOG_H__

// create a singleton class for sysem log

#include <string>
#include <iostream>

class S3Log{
public:
    static S3Log* Instance();
    //bool SetLogFile(std::string logFile);
    template<typename T>
    S3Log& operator <<(T data);
    S3Log(S3Log const&) = delete;             // copy constructor is disabled
    S3Log(S3Log&& ) = delete;             // move constructor is disabled
    S3Log& operator=(S3Log const&) = delete;// assignment operator is disabled
    void Flush();

    ~S3Log();// Private so that it can  not be called
private:
    S3Log(); //Private so that it can  not be called

    static S3Log* m_pInstance;
    //std::ostream _out_stream;
};

#endif
