#include "ObjectCreator.h"

#include "ObserverPolicyOnce.h"
#include "ThermoDetectorFa.h"
#include "ThermometerFa.h"
#include "ThermoObserverFa.h"

namespace ThermoSpace {

ThermometerCreator::ThermometerCreator()
{
}

ThermometerCreator::~ThermometerCreator()
{
}


Thermometer * ThermometerCreator::CreateThermometer(string name)
{
    if(name.compare("ThermometerFa") == 0)
        return new ThermometerFa();
    return nullptr;
}


DetectorCreator::DetectorCreator()
{
}

DetectorCreator::~DetectorCreator()
{
}

ThermoDetector * DetectorCreator::CreateDetector(string name)
{
    if(name.compare( "ThermoDetectorFa") == 0)
        return new ThermoDetectorFa();
    return nullptr;
}

ObserverCreator::ObserverCreator()
{
}

ObserverCreator::~ObserverCreator()
{
}

ThermoObserver* ObserverCreator::CreateObserver(string name)
{
    if(name.compare( "ThermoObserverFa") == 0)
        return new ThermoObserverFa();
    return nullptr;
}


PolicyCreator::PolicyCreator()
{
}

PolicyCreator::~PolicyCreator()
{
}

ObserverPolicy* PolicyCreator::CreatePolicy(string name)
{
    if(name.compare( "ObserverPolicyOnce") == 0)
        return new ObserverPolicyOnce();

    return nullptr;
}

}
