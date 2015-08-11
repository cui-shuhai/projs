
CC=g++
CPPFLAGS=-g -std=c++11 -Wall
LDFLAGS=
SOURCES= Dictionary.cpp DictionaryFactory.cpp EngDict.cpp main.cpp 

OBJECTS=$(SOURCES:.cpp=.o)
EXECUTABLE=FindPossibleWord

all:$(EXECUTABLE)
    
$(EXECUTABLE): $(OBJECTS) 
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

%o:%.cpp
	$(CC) $(CPPFLAGS) $< -o $@

clean:
	rm *.o
