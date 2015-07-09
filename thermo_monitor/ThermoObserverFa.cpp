
#include <iostream>

#include "Thermometer.h"
#include "ThermoObserverFa.h"

namespace ThermoSpace{

ThermoObserverFa::ThermoObserverFa()
{
}

ThermoObserverFa::~ThermoObserverFa()
{
}

void ThermoObserverFa::Update(Thermometer *thermometer)
{
    std::cout << thermometer->Read() << std::endl;
}


};
