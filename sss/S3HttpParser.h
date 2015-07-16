
#ifndef __S3HTTP_PARSER_H__
#define __S3HTTP_PARSER_H__

#include <string>

using namespace std;

class S3HttpParser{
public:
    S2HttpParser();
    S2HttpParser(string q);
    void SetQuery(string q);
    virtual ~S2HttpParser();

    virtual void Parse();

protected:
    string query;
    string dir;
    map<string, string>jsMap;
};

#endif
