
#ifndef __OBSERVER_POLICY_H__
#define __OBSERVER_POLICY_H__

#define INVALID_VAL  -1000

#include <vector>

using namespace std;

namespace ThermoSpace{

//encapsulation for the caller's policy

class ObserverPolicy
{
public:
    ObserverPolicy();
    virtual ~ObserverPolicy();
    virtual void SetThreshold(float v);
    virtual void RemoveThreshold(float v);
    virtual const std::vector<float>& GetThresholds() const;
    //Set how much difference is different
    virtual void SetFluncDiff(float diff);
    virtual float GetFluncDiff()const;
    //HasInterest checks current data and historical data to decide whether need to update
    virtual bool HasInterest(const std::vector<float> &values);

protected:
    virtual float FindHitThreshold(float v)const;
private:
    std::vector<float>thresholds;
    float flunc_diff;
};

};
#endif
