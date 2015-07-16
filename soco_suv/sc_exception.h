
#pragma once
#include <iostream>
#include <string>
#include <exception>

using namespace std;

#define ERR_SC_QT_PLAYER   -1
// SC_LOG_READ_THREAD |SC_LOG_SITE_REFRESH |
#define SC_LOG_FLAG    SC_LOG_REFRESH_THREAD //0x01c0
#define SC_LOG_THREAD    0x0001
#define SC_LOG_LEFT_PANE 0x0002
#define SC_LOG_DECODER   0x0004
#define SC_LOG_ENCODER   0x0008
#define SC_LOG_PLAYER    0x0010
#define SC_LOG_QT_PLAYER 0x0020
#define SC_LOG_READ_THREAD 0x0040
#define SC_LOG_SITE_REFRESH 0x0080
#define SC_LOG_VIDEO_THREAD    0x0100
#define SC_LOG_REFRESH_THREAD  0x0200
#define SC_LOG_OPENGL  0x0400
#define SC_LOG_MEM  0x0800

#ifdef DEBUG

#define sc_log2( l,  x )  \
    if( (l) & SC_LOG_FLAG )  \
    { cout << __FILE__ << ":   "   \
    << __LINE__ << ":    " << __FUNCTION__ << ":  " << #x  << ":    "    \
        << (x) << endl; cout.flush();  }

#define sc_mark( l )  \
    if( (l) & SC_LOG_FLAG )  \
    { cout << __FILE__ << ":   "   \
    << __LINE__ << ":    " << __FUNCTION__ << ":  " << #l     \
        << endl; cout.flush();  }


#define sc_log( x )  \
    { cout << __FILE__ << ":   "   \
    << __LINE__ << ":    " << __FUNCTION__ << ":  " << #x  << ":    "    \
        << (x) << endl; cout.flush();  }

#else
#define sc_log( x )
#define sc_log2( 1, x )
#define sc_mark( x )
#endif

#define SHOW_EX  { cout << __FILE__ << ":" \
    << __LINE__ << ":" << "return:" << e.msg() << endl; }

#define LOG_AV_ERR( x )  \
{ char  errbuf[256] = {0}; \
    av_strerror( (x), errbuf, 256 ); \
    cout << #x << errbuf << endl; cout.flush() ; }

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


