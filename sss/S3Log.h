
#ifndef __S3LOG_H__
#define __S3LOG_H__

//we do not need a singleton class since we may need several instances one for each file

#include <string>
#include <iostream>

class S3Log{
public:
    S3Log();
    static S3Log* Instance();
    bool SetLogFile(std::string logFile);
    template<typename T>
    S3Log& operator <<(T data);
    S3Log(S3Log const&) = delete;             // copy constructor is disabled
    S3Log(S3Log&& ) = delete;             // move constructor is disabled
    S3Log& operator=(S3Log const&) = delete;// assignment operator is disabled
    void Flush();

    ~S3Log();
private:

};

#endif
