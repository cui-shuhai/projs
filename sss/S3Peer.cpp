

#include <iostream>
#include "S3Peer.h"

#define MAX_INPUT  1024

static const unsigned short LISTEN_PORT = 8080;


S3Peer::S3Peer(){
}

S3Peer::~S3Peer(){
}

int S3Peer::Send(){
    return 0;
}

int S3Peer::Recv(){

    ssize_t count;
    char buf[512];

    count = read (fd, buf, sizeof buf);

    if (count <= 512)
    {
        send(fd, buf, count, 0);
        std::cout << "send back:" << buf;
    }
    else if (count == 0)
    {
        //query string too long
        //log and return
        return -1;
    }

    return 0;
}

int S3Peer::Process(){

    return Recv();
}
