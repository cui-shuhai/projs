#include <memory>
#include <exception>
#include "S3Server.h"

int
main (int argc, char *argv[])
{
    auto server = new S3ServerSocket(4000);
    //auto server = std::make_shared<S3ServerSocket>(4000);
    unsigned int backlog = 2000;

    try{
        server->SetNonBlockMode(false);
        server->Listen(backlog);
        server->Start();
    }
    catch(std::exception &e)
    {
        return -1;
    }

    return EXIT_SUCCESS;
}
