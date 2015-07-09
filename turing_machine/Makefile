
CC=gcc
CPPFLAGS=-pg  -Wall
LDFLAGS=
SOURCES= turing_machine.o turing_machine_main.o

OBJECTS=$(SOURCES:.c=.o)
EXECUTABLE=Turing_Machine

all:$(EXECUTABLE)
    
$(EXECUTABLE): $(OBJECTS) 
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

%o:%.c
	$(CC) $(CPPFLAGS) $< -o $@

clean:
	rm *.o
