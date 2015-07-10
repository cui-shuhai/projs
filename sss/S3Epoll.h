
#ifndef __S3EPOLL_H__
#define __S3EPOLL_H__

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
/**
* this class defines a server side socket comply with epoll
*/ 


class S3Epoll{
public:
    S3Epoll();
    int EpollAdd(int fd, struct epoll_event *event);
    int EpollMod(int fd, struct epoll_event *event);
    int EpollDel(int fd, struct epoll_event *event);
    void SetServer(S2Socket *svr);
    int Start();

private:
    int Init();
    
private:
    int efd;
    std::shared_ptr<S3Socket> server;
};


#endif
