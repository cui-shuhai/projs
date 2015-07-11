

#ifndef __S3PEER_H__
#define __S3PEER_H__
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


class S3Peer: public S3Socket{
public:
    S3Peer();
    ~S3Peer();

    virtual int Send() override final;
    virtual int Recv() override final;
    virtual int Process() override;
};


#endif
