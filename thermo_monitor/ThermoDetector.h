
#ifndef __THERMO_DETECTOR_H__
#define __THERMO_DETECTOR_H__

#include<vector>
#include<map>
#include<memory>

using namespace std;

namespace ThermoSpace{

//abatract class for reading temperatur of external sources either from different resurce or in different way
class ThermoDetector
{
public:
    ThermoDetector();
    virtual float Read() = 0;
    virtual ~ThermoDetector();
};

};
#endif
