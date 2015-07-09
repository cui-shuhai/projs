
CC=g++
CPPFLAGS=-g -std=c++11 -Wall
LDFLAGS=
SOURCES=ObserverPolicy.cpp ObserverPolicyOnce.cpp ThermoDetector.cpp ThermoDetectorFa.cpp Thermometer.cpp ThermometerFa.cpp ThermoObserver.cpp ThermoObserverFa.cpp Main.cpp ObjectCreator.cpp 

OBJECTS=$(SOURCES:.cpp=.o)
EXECUTABLE=Thermometer

all:$(EXECUTABLE)
    
$(EXECUTABLE): $(OBJECTS) 
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

%o:%.cpp
	$(CC) $(CPPFLAGS) $< -o $@

clean:
	rm *.o
