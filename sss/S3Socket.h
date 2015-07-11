

#ifndef __S3SOCKET_H__
#define __S3SOCKET_H__
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

#define MAXEVENTS 1024 
#define BACKLOG  128


class S3Epoll;
/**
* this class defines a socket either listening port or peer one
*/ 

class S3Socket{
public:
    S3Socket();
    ~S3Socket();
    int SetNonBlockMode(bool flag = true);
    virtual int Bind();
    virtual int Listen(unsigned int bl);
    virtual S3Socket * Accept();
    //virtual int Connect(const struct sockaddr *address);
    virtual int Send();
    virtual int Recv();
    virtual int Process() = 0;
    int Close();
    unsigned short GetPort();
    void SetPort(unsigned short pt);
    void GetAddr(struct sockaddr_in *inaddr);
    void SetAddr(struct sockaddr_in *inaddr);
    int GetDescriptor();
    void SetDescriptor(int desc);
    void SetEpoll(S3Epoll *ep);
    
protected:
    S3Epoll *epoll;
    struct sockaddr_in addr;
    unsigned short port;
    int fd;

#ifdef PROXY    
    S3Socket *peer;
#endif

};
#endif
