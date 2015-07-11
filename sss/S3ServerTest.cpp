#include <memory>
#include <exception>

#include "S3Epoll.h"
#include "S3Server.h"

int
main (int argc, char *argv[])
{
    auto server = std::make_shared<S3Server>(); 
    auto epoll = std::make_shared<S3Epoll>();

    epoll->SetServer(server);

    server->SetEpoll(epoll.get());


    unsigned int backlog = 2000;

    try{
        server->SetNonBlockMode(false);
        server->Listen(backlog);
        epoll->Start();
    }
    catch(std::exception &e)
    {
        return -1;
    }

    return EXIT_SUCCESS;
}
