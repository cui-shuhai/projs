CC = g++

#EXT_LIB = /usr/local/lib
#EXT_LIB = ../extern/lib
#LIBS = -lstdc++
EXT_INCLUDE = ../extern/include
#EXT_INCLUDE = /usr/local/include

MODULE = S3Server 
OBJS = S3Log.o 


CPPFLAGS = -g -std=c++11 -Wall
#CPPFLAGS =  -std=c++11 -L/usr/lib/x86_64-linux-gnu/4.8 $(LIBS) #-I$(libpq_srcdir) 
#CPPFLAGS =  -std=c++11 -L/usr/lib/gcc/x86_64-linux-gnu/4.8 $(LIBS) #-I$(libpq_srcdir) 
#SHLIB_LINK = $(libpq)
#SHLIB_LINK += -Bstatic -L$(EXT_LIB) -lmongoc-1.0 -lmongoc-priv -lbson-1.0 -Bdynamic -lssl -lcrypto -lsasl2
#SHLIB_PREREQS = submake-libpq

sonar-test: S3LogTest.cpp 
	$(CC) ${CPPFLAGS} S3LogTest.cpp -o S3LogTest 



