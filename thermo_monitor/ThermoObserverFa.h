
#ifndef __THERMO_OBSERVERFA_H__
#define __THERMO_OBSERVERFA_H__

#include "ThermoObserver.h"

namespace ThermoSpace{

class Thermometer;

//class interested in watching Faherenheit Therometer

class ThermoObserverFa: public ThermoObserver
{
public:
    ThermoObserverFa();
    virtual void Update(Thermometer* thermometer);
    virtual ~ThermoObserverFa();
};

};
#endif
