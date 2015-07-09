#ifndef __THERMOMETER_H__
#define __THERMOMETER_H__

#include<vector>
#include<map>
#include<memory>



namespace ThermoSpace{

class ThermoDetector;
class ThermoObserver;

//Abstract of thermometer
class Thermometer
{
public:
    Thermometer();
    virtual void AttachThermoObserver(std::shared_ptr<ThermoObserver> observer);

    virtual void DeAttachThermoObserver(std::shared_ptr<ThermoObserver> observer);
    virtual ~Thermometer();

    virtual void SetDetector(std::shared_ptr<ThermoDetector> detector);
    virtual std::shared_ptr<ThermoDetector> GetDetector();

    void Notify();
    virtual float Read() = 0;
    std::vector<float> & GetHistData();
private:
    std::vector<std::shared_ptr<ThermoObserver>> tempObservers;
    std::shared_ptr<ThermoDetector> detector;
    std::vector<float> histData;
};

};

#endif
