
#include "ThermoObserver.h"


namespace ThermoSpace{

class ObserverPolicy;

ThermoObserver::ThermoObserver():policy{ nullptr}
{
}

ThermoObserver::~ThermoObserver()
{
}

std::shared_ptr<ObserverPolicy> ThermoObserver::GetPolicy()
{
    return policy;
}

void ThermoObserver::SetPolicy(std::shared_ptr<ObserverPolicy> p)
{
    policy = p;
}

};
