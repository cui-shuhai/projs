CC = g++

INCLUDE= .

CPPFLAGS = -g -std=c++11 -Wall

S3LogTest: S3LogTest.cpp 
	$(CC) ${CPPFLAGS} S3LogTest.cpp -o S3LogTest 

S3TESTSOURCES= S3Epoll.cpp S3Log.cpp S3Peer.cpp S3Server.cpp S3ServerTest.cpp S3Socket.cpp S3Exception.cpp
S3TESTOBJS=$(S3TESTSOURCES:.cpp=.o)

test:$(S3TESTSOURCES) 
	$(CC) $(CPPFLAGS) $(S3TESTSOURCES) -o test 



SOURCES= S3Epoll.cpp S3Log.cpp S3Peer.cpp S3Server.cpp S3ServerTest.cpp S3Socket.cpp S3Exception.cpp

OBJECTS=$(SOURCES:.cpp=.o)
EXECUTABLE=s3server

all: $(EXECUTABLE) # S3LogTest  S3ServerTest

$(EXECUTABLE): $(OBJECTS)
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

%o:%.cpp
	$(CC) $(CPPFLAGS) $< -o $@

clean:
	rm *.o

