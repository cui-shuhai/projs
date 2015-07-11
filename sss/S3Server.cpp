

#include "S3Log.h"
#include "S3Epoll.h"
#include "S3Peer.h"
#include "S3Server.h"

extern S3Log log;
static const unsigned short LISTEN_PORT = 8080;

S3Server::S3Server(){

    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_family= AF_INET;
    addr.sin_port = htons(LISTEN_PORT);
}

S3Server::~S3Server(){
}

int S3Server::Bind(){
 return bind(fd, (struct sockaddr *) &addr, sizeof(struct sockaddr_in));
}

int S3Server::Listen(unsigned int bl){
    return listen(fd, bl);
}

S3Socket* S3Server::Accept()
{
    int s;
    char hbuf[NI_MAXHOST], sbuf[NI_MAXSERV];

    struct sockaddr address;
    socklen_t address_len;

    int nfd = accept (fd, &address, &address_len);

    if (nfd == -1){
        if ((errno == EAGAIN) || (errno == EWOULDBLOCK)){
            /* We have processed all incoming
            connections. */
            return nullptr;
        }
        else {
            perror ("accept");
            return nullptr;
        }
    }

    s = getnameinfo (&address, address_len,
            hbuf, sizeof hbuf,
            sbuf, sizeof sbuf,
            NI_NUMERICHOST | NI_NUMERICSERV);


    if (s == 0) {
        log << "Accepted connection on descriptor" << nfd <<
        "(host=" << hbuf << ", port= "<< sbuf << ")\n";
    }

    S3Socket *sock = new S3Peer();

    sock->SetDescriptor(nfd);
    sock->SetAddr(reinterpret_cast<sockaddr_in*>(&address));
    sock->SetNonBlockMode();

    return sock;
}

int S3Server::Process(){
    
    int s;
    struct epoll_event event;

    while (1)
    {
        S3Socket *sock = Accept(); 

        if(!sock)
            return 0;



        event.data.ptr = sock;
        event.events = EPOLLIN | EPOLLET;
        s = epoll->EpollAdd(sock->GetDescriptor(), &event);
        if (s == -1)
        {
            perror ("epoll_ctl");
            abort ();
        }
    }

    return -1;
}
