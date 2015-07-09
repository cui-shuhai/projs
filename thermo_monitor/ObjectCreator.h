
#ifndef __OBJECT_CREATOR_H__
#define __OBJECT_CREATOR_H__

#include <string>
using namespace std;

//Factory classes for creating objects
//If policy is complicate, maybe builder is better

namespace ThermoSpace
{

class Thermometer;
class ThermoDetector;
class ThermoObserver;
class ObserverPolicy;

class ThermometerCreator
{
public:
    ThermometerCreator();
    ~ThermometerCreator();
    Thermometer * CreateThermometer(string name);
};


class DetectorCreator
{
public:
    DetectorCreator();
    ~DetectorCreator();
    ThermoDetector * CreateDetector(string name);
};

class ObserverCreator
{
public:
    ObserverCreator();
    ~ObserverCreator();
    ThermoObserver* CreateObserver(string name);
};

class PolicyCreator
{
public:
    PolicyCreator();
    ~PolicyCreator();
    ObserverPolicy* CreatePolicy(string name);
};
 
};
#endif

