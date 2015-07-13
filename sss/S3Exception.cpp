

#include "S3Exception.h"

S3Exception::S3Exception(std::string msg){
    std::cout << msg;
}

S3Exception::S3Exception(int msg){
    std::cout << "error code:" <<  msg;
}



S3Exception::~S3Exception()
{
}
