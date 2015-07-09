

#include "ObjectCreator.h"
#include "ObserverPolicy.h"
#include "ThermoDetector.h"
#include "Thermometer.h"
#include "ThermoObserver.h"

using namespace ThermoSpace;

int main( int argc, char** argv)
{
    ThermometerCreator thermoCreator;
    shared_ptr<Thermometer> thermometer(thermoCreator.CreateThermometer("ThermometerFa"));

    DetectorCreator  detectorCreator;
    shared_ptr<ThermoDetector> detector(detectorCreator.CreateDetector("ThermoDetectorFa"));
    thermometer->SetDetector(detector);

    ObserverCreator observerCreator;
    shared_ptr<ThermoObserver> thermoObserverFa(observerCreator.CreateObserver("ThermoObserverFa"));


    PolicyCreator policyCreator;
    shared_ptr<ObserverPolicy> oncePolicy(policyCreator.CreatePolicy("ObserverPolicyOnce"));

    thermoObserverFa->SetPolicy(oncePolicy);

    thermometer->AttachThermoObserver(thermoObserverFa);

    thermometer->Read();
    thermometer->Notify();
}





