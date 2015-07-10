
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

#define MAXEVENTS 1024 
#define BACKLOG  128
/**
* this class defines a server side socket comply with epoll
*/ 

#ifdef __DOC__
typedef union epoll_data
{
    void        *ptr;
    int          fd;
    __uint32_t   u32;
    __uint64_t   u64;
} epoll_data_t;

struct epoll_event
{
    __uint32_t   events; /* Epoll events */
    epoll_data_t data;   /* User data variable */
};
#endif


classs S3ServerSocket{
public:
    S3ServerSocket();
    explicit S3ServerSocket(unsigned short port);
    int SetNonBlockMode(bool flag = true);
    inline int EpollAdd(int fd, struct epoll_event *event);
    inline int EpollMod(int fd, struct epoll_event *event);
    inline int EpollDel(int fd, struct epoll_event *event);
    inline int Listen(unsigned int bl = BACKLOG);
    int Start();

private:
    int Init();
    
private:
    unsigned short port;
    int fd;
    int epfd;
};


#endif
