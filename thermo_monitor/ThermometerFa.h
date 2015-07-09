#ifndef __THERMOMETERFA_H__
#define __THERMOMETERFA_H__


#include "Thermometer.h"

namespace ThermoSpace{

//Abstraction from Fahrenheit thermometer
class ThermometerFa: public Thermometer
{
public:
    ThermometerFa();

    virtual ~ThermometerFa();
    virtual float Read();
};

};
#endif
