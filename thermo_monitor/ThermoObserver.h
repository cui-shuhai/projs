
#ifndef __THERMO_OBSERVER_H__
#define __THERMO_OBSERVER_H__

#include <memory>

namespace ThermoSpace{

class ObserverPolicy;
class Thermometer;

//Abstraction for all callers interested in external sorce temperatures
class ThermoObserver
{
public:
    ThermoObserver();
    virtual void Update(Thermometer* thermometer) = 0;
    virtual ~ThermoObserver();
    virtual std::shared_ptr<ObserverPolicy> GetPolicy();
    virtual void SetPolicy(std::shared_ptr<ObserverPolicy> p);

private:
    std::shared_ptr<ObserverPolicy> policy;
};

};

#endif
