
#include <algorithm>

#include "ObserverPolicy.h"

namespace ThermoSpace{

ObserverPolicy::ObserverPolicy()
{
}

ObserverPolicy::~ObserverPolicy()
{
}

bool ObserverPolicy::HasInterest(const std::vector<float> &values)
{
    return true; 
}

void ObserverPolicy::SetThreshold(float v)
{
    thresholds.push_back(v);
}

void ObserverPolicy::RemoveThreshold(float val)
{
    auto it = thresholds.begin();

    for(; it != thresholds.end(); it++)
    {
        float v = *it;
        if(v - val < 0.001 || val -v < 0.001)
            break;
    }

    if( it != thresholds.end())
        thresholds.erase(it);
}

const std::vector<float>& ObserverPolicy::GetThresholds()const 
{
    return thresholds;
}

float ObserverPolicy::FindHitThreshold(float val)const
{
    auto it = thresholds.begin();

    for(; it != thresholds.end(); it++)
    {
        float v = *it;
        if(v - val < 0.001 || val -v < 0.001)
            break;
    }

    if( it != thresholds.end())
        return *it;

    return INVALID_VAL;
}

void ObserverPolicy::SetFluncDiff(float diff)
{
    flunc_diff = diff;
}

float ObserverPolicy::GetFluncDiff()const
{
    return flunc_diff;
}

};
