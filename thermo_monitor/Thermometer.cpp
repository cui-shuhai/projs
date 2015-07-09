

#include <algorithm>

#include "ThermoObserver.h"
#include "ObserverPolicy.h"
#include "Thermometer.h"

namespace ThermoSpace{

Thermometer::Thermometer()
{
}

Thermometer::~Thermometer()
{
}

void Thermometer::AttachThermoObserver(std::shared_ptr<ThermoObserver> observer)
{
    tempObservers.push_back(observer);
}

void Thermometer::DeAttachThermoObserver(std::shared_ptr<ThermoObserver> observer)
{
    auto obsvr = std::find(tempObservers.begin(), tempObservers.end(), observer);

    if(obsvr != tempObservers.end())
        tempObservers.erase(obsvr);
}


void Thermometer::SetDetector(std::shared_ptr<ThermoDetector> dector)
{
    detector = dector; 
}

std::shared_ptr<ThermoDetector> Thermometer::GetDetector()
{
    return detector;
}

void Thermometer::Notify()
{
    for (auto &v: tempObservers)
    {
        if(v->GetPolicy()->HasInterest(histData))
        {
            v->Update(this);
        }

    }
}

std::vector<float>& Thermometer::GetHistData()
{
    return histData;
}

}
