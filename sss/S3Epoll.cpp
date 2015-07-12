
#include "S3Log.h"
#include "S3Epoll.h"


S3Epoll::S3Epoll():efd{epoll_create1(0)}, server(nullptr){
}


void S3Epoll::SetServer(std::shared_ptr<S3Socket> svr){
    server = svr; 
}

int S3Epoll::Init(){

    if(!server)
    {
        log << "Listening socke no created";
        return -1;
    }

    server->Bind();
    server->Listen((unsigned int)2000);
    return 0;
}

int S3Epoll::EpollAdd(int fd, struct epoll_event *event){
    return epoll_ctl(efd, EPOLL_CTL_ADD, fd, event);
}

int S3Epoll::EpollMod(int fd, struct epoll_event *event){
    return epoll_ctl(efd, EPOLL_CTL_MOD, fd, event);
}

int S3Epoll::EpollDel(int fd, struct epoll_event *event){
    return epoll_ctl(efd, EPOLL_CTL_DEL, fd, nullptr);
}

int S3Epoll::Start(){
    struct epoll_event event;
    struct epoll_event *events;

    Init();

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
                log << "epoll error" ; 

                //XXX Need to free it?
                (static_cast<S3Socket*>(events[i].data.ptr))->Close();
                continue;
            }
            else
            {
                S3Socket *sock = static_cast<S3Socket*>(events[i].data.ptr);
                sock->Process();
            }
        }
    }

    return 0;
}
