#include "S2Server.h"

int
main (int argc, char *argv[])
{
    shared_ptr<S3ServerSocket> server = make_shared(S3ServerSocket(4000));;

    try{
        server->SetNonBlockMode(false);
        server->Listen(200);
        server->Start();
    }
    /*catch(S3Except &e)
    {
        return -1;
    }
    */

    return EXIT_SUCCESS;
}
