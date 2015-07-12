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
    epoll->Start();

    return EXIT_SUCCESS;
}
