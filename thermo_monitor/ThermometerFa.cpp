

#include "ThermoDetector.h"
#include "ThermometerFa.h"


namespace ThermoSpace{

ThermometerFa::ThermometerFa()
{
}

ThermometerFa::~ThermometerFa()
{
}

float ThermometerFa::Read()
{
    float val = GetDetector()->Read();

    std::vector<float> &histData = GetHistData();

    if(histData.size() < 3)
        histData.push_back(val);
    histData[0] = histData[1];
    histData[1] = histData[2];
    histData[2] = val;

    return val;
}

};
