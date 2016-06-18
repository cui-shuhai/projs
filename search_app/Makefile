SOURCE=App.cpp CurlClient.cpp InputVerifier.cpp AddressInput.cpp CategoryInput.cpp InputEmptyChecker.cpp InputValidityChecker.cpp EndDateInput.cpp StartDateInput.cpp \
RadiusInput.cpp

MYPROGRAM=search_app
MYINCLUDES=-I/usr/include

OPTIONS=-std=c++11 -g 

LIBRARYPATH=-L/usr/lib/x86_64-linux-gnu 

#debuge modules
MYLIBRARIES= -lpthread  -lcurl

CC=g++

#------------------------------------------------------------------------------


%.o: %.cpp
	$(CC) $(OPTIONS) $< -o $@


all: $(MYPROGRAM)



$(MYPROGRAM): $(SOURCE)

	$(CC)  $(OPTIONS) $(MYINCLUDES) $(SOURCE) -o$(MYPROGRAM) $(LIBRARYPATH) $(MYLIBRARIES)

clean:

	rm -f $(MYPROGRAM)

