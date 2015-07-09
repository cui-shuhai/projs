#include "ObserverPolicyOnce.h"

namespace ThermoSpace{

ObserverPolicyOnce::ObserverPolicyOnce()
{
}

ObserverPolicyOnce::~ObserverPolicyOnce()
{
}

bool ObserverPolicyOnce::HasInterest(const std::vector<float>& values)
{
    float last_val = values.back();

    float thresh_val = FindHitThreshold(last_val);

    if(thresh_val - INVALID_VAL < 1 || INVALID_VAL - thresh_val < 1 )
        return false;

    //Now we have find an iterest value

    if(values.size() < 2)
        return true;

    float prev_val = values[values.size() -2];


    if(prev_val - thresh_val < 0.01 || thresh_val - prev_val < 0.001 )
    {
        //Already reported and quite same
        return false;
    }

    if(prev_val - last_val > GetFluncDiff() || last_val - prev_val > GetFluncDiff())
     {
         //change over flunc_diff
         return true;
     }

     return false;
}

};
