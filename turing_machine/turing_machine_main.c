
#include <stdlib.h>
#include <stdio.h>

#include "turing_machine.h"

int main(int argc, char** argv)
{
    // check command line parameter
    if (argc != 2)
    {
        fprintf(stderr, "Usgae: %s configure file\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    //create turing _machine and initialize
    turing_machine turing_m = {0};

    //iniitalize turing machhine from configuration file
    read_configuration(&turing_m, argv[1]);

    //running turing machine
    turing_run(&turing_m);

    //print final tape content
    fprintf(stdout, "\n This is a repeat of the final tape content from above last line \n");
    print_tape(turing_m.initial_tape);

    return 0;

}

