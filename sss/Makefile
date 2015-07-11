CC = g++

INCLUDE= .

CPPFLAGS = -g -std=c++11 -Wall

S3LogTest: S3LogTest.cpp 
	$(CC) ${CPPFLAGS} S3LogTest.cpp -o S3LogTest 

S3ServerTest: S3ServerTest.cpp S3Server.cpp
	$(CC) ${CPPFLAGS} S3ServerTest.cpp S3Server.cpp -o S2ServerTest 



SOURCES= S3Epoll.cpp S3Log.cpp S3Peer.cpp S3Server.cpp S3ServerTest.cpp S3Socket.cpp

OBJECTS=$(SOURCES:.cpp=.o)
EXECUTABLE=s3server

all: $(EXECUTABLE) # S3LogTest  S3ServerTest

$(EXECUTABLE): $(OBJECTS)
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

%o:%.cpp
	$(CC) $(CPPFLAGS) $< -o $@

clean:
	rm *.o

