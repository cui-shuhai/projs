

#ifndef __S3SERVER_H__
#define __S3SERVER_H__
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/epoll.h>
#include <errno.h>

#include "S3Socket.h"
#define MAXEVENTS 1024 
#define BACKLOG  128
/**
* this class defines a server side socket 
*/ 


class S3Server: public S3Socket{
public:
    S3Server();
    ~S3Server();
    virtual int Bind();
    virtual int Listen(unsigned int bl);
    virtual int Process() override;
    virtual S3Socket * Accept();
private:
};


#endif
