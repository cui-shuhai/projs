

#include <string>
#include <iostream>

using namespace std;

#include "sc_exception.h"

sc_exception::sc_exception(int v )
{
    cout << ( info = v ) << endl;
}
#if 1
sc_exception::~sc_exception()throw()
{
}
#endif

int sc_exception::msg() const throw()
{
    return info;
}


