
#ifndef __S3EXCEPTION_H__
#define __S3EXCEPTION_H__


#include <exception>
#include <string>
#include <iostream>

class S3Exception: public std::exception{
public:
    S3Exception(std::string msg);
    S3Exception(int msg);
    ~S3Exception();
};

#endif
