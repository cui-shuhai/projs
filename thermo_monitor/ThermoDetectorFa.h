

#ifndef __THERMO_DETECTORA_H__
#define __THERMO_DETECTORA_H__


#include "ThermoDetector.h"

namespace ThermoSpace{

//calss for reading temperature in Faherenheit of external source
class ThermoDetectorFa: public ThermoDetector
{
public:
    ThermoDetectorFa();
    virtual float Read() override;
    virtual ~ThermoDetectorFa();
};

};
#endif
