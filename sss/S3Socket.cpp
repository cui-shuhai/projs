

#include "S3Socket.h"


S3Socket::S3Socket():epoll{nullptr}{}

int 
S3Socket::SetNonBlockMode(bool flag){

    int flags, s;

    flags = fcntl (fd, F_GETFL, 0);
    if (flags == -1)
    {
        perror ("fcntl");
        return -1;
    }

    if(flag)
    {
        flags |= O_NONBLOCK;
        s = fcntl (fd, F_SETFL, flags);
        if (s == -1)
        {
            perror ("fcntl");
            return -1;
        }
    }
    return 0;
}

int S3Socket::Bind(){
    return 0;
}


int S3Socket::Listen( unsigned int bl){
    return 0;
}

S3Socket * S3Socket::Accept(){
    return nullptr;
}

/* This is for server side, not necessary
int S3Socket::Connect(const struct sockaddr *address){
}
*/

int S3Socket::Send(){
    return 0;
}

int S3Socket::Recv(){
    return 0;
}

unsigned short S3Socket::GetPort(){
    return port;
}

void S3Socket::SetPort(unsigned short pt){
    port = pt;
}

void S3Socket::GetAddr(struct sockaddr_in *inaddr){
    memcpy(inaddr, &addr, sizeof(addr));
}

void S3Socket::SetAddr(struct sockaddr_in *inaddr){
    memcpy(&addr, inaddr, sizeof(addr));
}

int S3Socket::GetDescriptor(){
    return fd;
}

void S3Socket::SetDescriptor(int desc){
    fd = desc;
}

int S3Socket::Close(){
    return close(fd);
}

void S3Socket::SetEpoll(S3Epoll *ep){
    epoll = ep;
}
