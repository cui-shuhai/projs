
#pragma once
#include <iostream>
#include <string>
#include <exception>

using namespace std;

#ifdef DEBUG

#define sc_log( x )  \
    { cout << __FILE__ << ":   "   \
    << __LINE__ << ":    " << __FUNCTION__ << ":  " << #x  << ":    "    \
        << (x) << endl; cout.flush();  }

#define sc_mark( x )    { cout << #x << endl ; cout.flush(); }

#else
#define sc_log( x )
#define sc_mark( x )
#endif

#define SHOW_EX  { cout << __FILE__ << ":" \
    << __LINE__ << ":" << "return:" << e.msg() << endl; }


class sc_exception :public std::exception
{
public:
    sc_exception(int msg );
    int msg() const throw();
public:
    ~sc_exception() throw();

private:
    int info;
};


