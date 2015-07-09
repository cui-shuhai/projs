
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "turing_machine.h"

int init_tape(Tape **tape, char* content)
{
    int rc = 0;
    char *pcontent = content;

    //create tape list head node
    *tape = (Tape*)malloc(sizeof(Tape));

    if(tape == NULL)
    {
        fprintf(stderr, "Failed to allocate memory\n");
        return -1;
    }

    //initialize with first character
    Tape *p = *tape;
    p->content = *pcontent;
    p->prev = NULL;
    p->next = NULL;

    //if it is empty line, iniitalize and return
    if (p->content == '\n')
    {
        p->content = '_';
        return rc;
    }

    
    //move forware to add one node for each character
    while( *++pcontent != '\n')
    {
        Tape *tmp = (Tape*)malloc(sizeof(Tape));

        if(tmp == NULL)
        {
            fprintf(stderr, "Failed to allocate memory\n");
            rc = -1;
            break;
        }

        tmp->content = *pcontent;
        tmp->prev = p;
        tmp->next = NULL;
        p->next = tmp;
        p = tmp;
    }

    //if allocation fails, clean up and return
    if(rc == -1)
    {
        p = *tape;
        Tape *tmp;
        while(p != NULL)
        {
            tmp = p->next;
            free(p);
            p = tmp;
        }

        *tape = NULL;
    }

    return rc;
}

int  line_to_int(char* line)
{
    int len = strlen(line);
    //change newline to string end mark
    if (line[len - 1] == '\n')
    {
        line[len - 1]='\0';
        return atoi(line);
    }
    else
    {
        fprintf(stderr, "Failed to read a number\n");
        return -1;
    }
}

int machine_add_state(turing_machine *turing_m, char *act_s)
{
    int start_state;
    char *p = act_s;

    start_state = read_num(&p);

    //
    Action * action = (Action*)malloc(sizeof(Action));

    if (action == NULL)
        return -1;

    //read action parameters
    action->read_char = read_char(&p);
    action->write_char = read_char(&p);
    action->shift= (Direction)read_num(&p);
    action->next_state = read_num(&p);

    //prepend new action node for start_state action list
    action->na = turing_m->action_table[start_state];

    turing_m->action_table[start_state] = action;
    return 0;
}


int read_num(char ** str)
{
    char *p = *str;
    if(*p == '\n')
    {
        fprintf(stderr, "Failed to read a number\n");
        exit(EXIT_FAILURE);
    }

    //skip space
    while(*p != '\n' && (*p == ' ' || *p == '\t')) ++p;

    char *pe = p;

    //find end of number
    while(*pe != '\n' && *pe != ' ' && *pe != '\t') ++pe;

    if(*pe != '\n')
    {
        *pe = '\0';
        *str = pe + 1;
        return atoi(p);
    }
    else
    {
        //if end with newline, change it to '\0' in order to convert, and then put newline back
        *pe = '\0';
        int rc = atoi(p);
        *str = pe;
        *pe = '\n';

        return rc;
    }
}
char read_char(char **str)
{
    char *p = *str;

    //skip space
    while( *p != '\n' && (*p == ' ' || *p == '\t')) ++p;

    if(*p != '\n')
    {
        *str = p + 1;
        return *p;
    }
     else
     {
        fprintf(stderr, "wrong action format\n");
        exit(EXIT_FAILURE);
     }
}


void print_tape(Tape *tape)
{
    Tape *p = tape;
    while(p != NULL)
    {
        fprintf(stdout, "%c", p->content);
        p = p->next;
    }

    fprintf(stdout, "\n");
}

void read_configuration(turing_machine *turing_m, const char* file)
{
    //read configure file
    char line_content[128]; // assume initial content less then 128;

    FILE *f = fopen(file, "r");

    if(f == NULL)
    {
        fprintf(stderr, "Can't open file %s", file);
        exit(EXIT_FAILURE);
    }

    //read initial tape content
    if(fgets(line_content, sizeof(line_content), f) != NULL)
    {

        //Initialize aype 
        if (init_tape(&turing_m->initial_tape, line_content) == -1)
        {
            fprintf(stderr, "Failed to initialize tape\n");
            exit(EXIT_FAILURE);
        }
    }
    else
    {
        fprintf(stderr, "Failed to read initial content\n");
        exit(EXIT_FAILURE);
    }

    //read  initial start_offset 
    if (fgets(line_content, sizeof(line_content), f) != NULL)
    {
        turing_m->start_offset = line_to_int(line_content);
        if (turing_m->initial_tape->next == NULL)
            turing_m->start_offset = 0;
    }
    else
    {
        fprintf(stderr, "Failed to read start_offset\n");
        exit(EXIT_FAILURE);
    }

    
    //read start-state
    if (fgets(line_content, sizeof(line_content), f) != NULL)
    {
        turing_m->start_state = line_to_int(line_content);
    }
    else
    {
        fprintf(stderr, "Failed to read start_state\n");
        exit(EXIT_FAILURE);
    }

    //read halt-state
    if (fgets(line_content, sizeof(line_content), f) != NULL)
    {

        turing_m->halt_state = line_to_int(line_content);
    }
    else
    {
        fprintf(stderr, "Failed to read halt_state\n");
        exit(EXIT_FAILURE);
    }

    //read actions 
    while (fgets(line_content, sizeof(line_content), f) != NULL)
    {

        machine_add_state(turing_m, line_content);
    }

    fclose(f);
}

void turing_run(turing_machine *turing_m)
{
    char rchar;
    int i;
    turing_m->cur_state = turing_m->start_state;

    turing_m->cur_tape = turing_m->initial_tape;

    //move tape to start position
    for (i = 0; i< turing_m->start_offset; i++)
        turing_m->cur_tape = turing_m->cur_tape->next;

    rchar = turing_m->cur_tape->content;

    //running till reach halt state
    while (turing_m->cur_state != turing_m->halt_state)
    {
        Action *a = turing_m->action_table[turing_m->cur_state];

        //check to find action node
        while ( a != NULL && a->read_char != rchar)
            a = a->na;

        //if no action node match, check if there is wildcard match
        if(a == NULL)
        {
            a = turing_m->action_table[turing_m->cur_state];
            while (a != NULL && a->read_char != '*')
                a = a->na;

            if(a == NULL)
            {
                fprintf(stderr, "Failed to action node for start state:%d, read: %c\n", turing_m->cur_state, rchar );
                exit(EXIT_FAILURE);
            }
        }

        //update read character with write character if needed
        if (a->write_char != a->read_char && a->write_char != '*')
            turing_m->cur_tape->content = a->write_char;

         turing_m->cur_state = a->next_state;

         //move tape according to the action instruction
         if (a->shift == LEFT)
         {
            if (turing_m->cur_tape->prev)
                turing_m->cur_tape = turing_m->cur_tape->prev;
            else
            {
                if (pre_extend_tape(turing_m->cur_tape) == -1)
                {
                    fprintf(stderr, "failed to extend tape\n");
                    exit(EXIT_FAILURE);
                }

                turing_m->cur_tape = turing_m->cur_tape->prev;
                turing_m->initial_tape = turing_m->cur_tape;
            }
         }
         else if (a->shift == RIGHT)
         {
             if (turing_m->cur_tape->next)
                 turing_m->cur_tape = turing_m->cur_tape->next;
             else
             {
                if (post_extend_tape(turing_m->cur_tape) == -1)
                {
                    fprintf(stderr, "failed to extend tape\n");
                    exit(EXIT_FAILURE);
                }

                turing_m->cur_tape = turing_m->cur_tape->next;

             }
         }

        //print tape content for each state change
        print_tape(turing_m->initial_tape);

        rchar = turing_m->cur_tape->content;
    }

}

int pre_extend_tape(Tape *tape)
{
    //create a new node and put ahead
    Tape *tmp = (Tape*)malloc(sizeof(Tape));

    if(tmp == NULL)
    {
        fprintf(stderr, "Failed to allocate memory\n");
        return -1;
    }

    tmp->content = '-';
    tmp->next = tape;
    tmp->prev = NULL;
    tape->prev = tmp;
    return 0;
}
int post_extend_tape(Tape *tape)
{
    //create a new node and append behind
    Tape *tmp = (Tape*)malloc(sizeof(Tape));

    if(tmp == NULL)
    {
        fprintf(stderr, "Failed to allocate memory\n");
        return  -1;
    }

    tmp->content = '-';
    tmp->prev = tape;
    tmp->next = NULL;
    tape->next = tmp;
    return 0;
}
