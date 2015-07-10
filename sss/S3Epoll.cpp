
#include "S3Epoll.h"

extern S3Log log;

S3Epoll::S3Epoll():epfd{epoll_create1(0)}, server(nullptr){
}


void S3Epoll::SetServer(std::shared_ptr<S2Socket> svr){
    server = svr; 
}

int S3Epoll::Init(){

    if(!server)
    {
        log << "Listening socke no created";
        return -1;
    }

    server->Bind();
    server->Listen();
    return 0;
}

int S3Epoll::EpollAdd(int fd, struct epoll_event *event){
    return epoll_ctl(epfd, EPOLL_CTL_ADD, fd, event);
}

int S3Epoll::EpollMod(int fd, struct epoll_event *event){
    return epoll_ctl(epfd, EPOLL_CTL_MOD, fd, event);
}

int S3Epoll::EpollDel(int fd, struct epoll_event *event){
    return epoll_ctl(epfd, EPOLL_CTL_DEL, fd, nullptr);
}
/*
int S3Epoll::Listen(unsigned int bl){
    return listen(fd, bl);
}
*/

int S3Epoll::Start(){
    int s;
    struct epoll_event event;
    struct epoll_event *events;

    event.data.ptr = server.get();
    event.events = EPOLLIN | EPOLLET;
    EpollAdd(server->GetDescriptor(), &event);

    events = static_cast<epoll_event*>(calloc(MAXEVENTS, sizeof(event)));

    while(1){

        int n, i;
        n = epoll_wait(efd, events, MAXEVENTS, -1);

        for (i = 0; i < n; i++)
        {
            if ((events[i].events & EPOLLERR) ||
            (events[i].events & EPOLLHUP) ||
            (!(events[i].events & EPOLLIN))){
                /* An error has occured on this fd, or the socket is not
                ready for reading (why were we notified then?) */
                log << "epoll error\n" << std::endl;

                //XXX Need to free it?
                (static_cast<S3Socket*>(events[i].data.ptr))->Close();
                continue;
            }
            else if (server->IsMe(events[i].data.fd))
            {
                /* We have a notification on the listening socket, which
                means one or more incoming connections. */
                while (1)
                {
                    struct sockaddr in_addr;
                    socklen_t in_len;
                    int infd;
                    char hbuf[NI_MAXHOST], sbuf[NI_MAXSERV];

                    in_len = sizeof in_addr;
                    infd = accept (server->GetDescriptor(), &in_addr, &in_len);
                    if (infd == -1){
                        if ((errno == EAGAIN) || (errno == EWOULDBLOCK)){
                            /* We have processed all incoming
                            connections. */
                            break;
                        }
                        else {
                            perror ("accept");
                            break;
                        }
                    }

                    s = getnameinfo (&in_addr, in_len,
                        hbuf, sizeof hbuf,
                        sbuf, sizeof sbuf,
                        NI_NUMERICHOST | NI_NUMERICSERV);

                    if (s == 0) {
                        log << "Accepted connection on descriptor" << infd <<
                        "(host=" << hbuf << ", port= "<< sbuf << ")\n";
                    }

                    S3Socket *sock = std::make_shared<S3Peer>();

                    sock->SetDescriptor(infd);
                    sock->SetAddr(&in_addr);
                    sock->SetNonBlockMode();


                    event.data.ptr = sock;
                    event.events = EPOLLIN | EPOLLET;
                    s = EpollAdd(infd, &event);
                    if (s == -1)
                    {
                        perror ("epoll_ctl");
                        abort ();
                    }
                }
                continue;
            }
            else
            {
                /* We have data on the fd waiting to be read. Read and
                display it. We must read whatever data is available
                completely, as we are running in edge-triggered mode
                and won't get a notification again for the same
                data. */
                int done = 0;

                while (1){
                    ssize_t count;
                    char buf[512];

                    count = read (events[i].data.fd, buf, sizeof buf);
                    if (count == -1) {
                        /* If errno == EAGAIN, that means we have read all
                        data. So go back to the main loop. */
                        if (errno != EAGAIN) {
                            perror ("read");
                            done = 1;
                        }
                        break;
                    }
                    else if (count == 0)
                    {
                        /* End of file. The remote has closed the
                        connection. */
                        done = 1;
                        break;
                    }

                    /* Write the buffer to standard output */
                    s = write (1, buf, count);
                    if (s == -1){
                        perror ("write");
                        abort ();
                    }
                }

                if (done)
                {
                    printf ("Closed connection on descriptor %d\n",
                    events[i].data.fd);

                    /* Closing the descriptor will make epoll remove it
                    from the set of descriptors which are monitored. */
                    close (events[i].data.fd);
                }
            }
        }
    }
}
