

#ifndef __OBSERVER_POLICYFONCE_H__
#define __OBSERVER_POLICYFONCE_H__

#include "ObserverPolicy.h"

namespace ThermoSpace{

//Policy for not repeatedly report
class ObserverPolicyOnce: public ObserverPolicy
{
public:
    ObserverPolicyOnce();
    virtual ~ObserverPolicyOnce();
    virtual bool HasInterest(const std::vector<float> &values);
    private:
};

};

#endif
