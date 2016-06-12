SOURCE=NLTemplate.cpp test.cpp
MYPROGRAM=template_rest
MYINCLUDES=-I/usr/include -I/usr/local/include
OPTIONS=-std=c++11 -g 

#LIBRARYPATH=-L/usr/lib/x86_64-linux-gnu 
#debuge modules
#MYLIBRARIES= -lpthread  -lboost_date_time -lboost_filesystem -lboost_thread \
#-lboost_regex -lboost_system  -lboost_coroutine -lboost_context  

#release block
#-l/usr/lib/x86_64-linux-gnu/libboost_context.so
#-l/usr/lib/x86_64-linux-gnu/libboost_coroutine.a
#-l/usr/lib/x86_64-linux-gnu/libboost_date_time.so
#-l/usr/lib/x86_64-linux-gnu/libboost_filesystem.so

#-l/usr/lib/x86_64-linux-gnu/libboost_system.so
#-l/usr/lib/x86_64-linux-gnu/libboost_thread.so
#-l/usr/lib/x86_64-linux-gnu/libboost_regex.so
CC=g++

#------------------------------------------------------------------------------



all: $(MYPROGRAM)



$(MYPROGRAM): $(SOURCE)

	$(CC)  $(OPTIONS) $(MYINCLUDES) $(SOURCE) -o $(MYPROGRAM) 

clean:

	rm -f $(MYPROGRAM)

