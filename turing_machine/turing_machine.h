
#ifndef __TURING_MACHINE_H__
#define __TURING_MACHINE_H__

//define maximum number of state. 
//it can be implemented by reading configuratin file first and parse the maximus number of states
#define MAX_STATES  10

typedef enum Direction
{
    LEFT = -1,
    STAY = 0,
    RIGHT = 1,
} Direction;

//define Tape node structure
typedef struct Tape_t  Tape;

struct Tape_t
{
    Tape *  prev;
    Tape * next;
    char content;
};


//define Action nodes list for each state
typedef struct Action_t Action;
struct Action_t
{
    char read_char;
    char write_char;
    Direction shift;
    int next_state;
    Action *na;
};


//define turing machine structure
typedef struct Turing_machine_t turing_machine;
struct Turing_machine_t
{
    Tape * initial_tape;
    Tape * cur_tape;
    int start_offset;
    int start_state;
    int halt_state;
    Action *action_table[MAX_STATES];
    int cur_state;
};

//initialize tape with starting content
int init_tape(Tape **tape, char* content);

//convert newline ended single-int string into int
int  line_to_int(char* line);

//adding new action to turing machine
int machine_add_state(turing_machine *turing_m, char *action);

//read an integer and move the string forward
int read_num(char**);

//read one char and move the string forward
char read_char(char**);

//print the type contents
void print_tape(Tape *tape);

//initialize turing machine with configuration file 
void read_configuration(turing_machine *turing_m, const char *file);

//start turing machine to run
void turing_run(turing_machine *turing_m);

//if tape reached end, extend one node
int pre_extend_tape(Tape *tape);

//if tape reached head and need extend, extend one node left
int post_extend_tape(Tape *tape);
#endif
