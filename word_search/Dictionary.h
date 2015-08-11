
#ifndef __DICTINARY_H__
#define __DICTINARY_H__

#include <string>
#include "WordFinder.h"

using namespace std;

class Dictionary{
    public:
        Dictionary();
        Dictionary( const Dictionary &) = delete;
        Dictionary( Dictionary &&) = delete;
        Dictionary & operator = ( const Dictionary &) = delete;
        Dictionary & operator = ( Dictionary &&) = delete;
        virtual void AddWord(string w) = 0;
        virtual bool FindWord(string w) = 0;
        virtual void FindWords(string w) = 0;

        virtual ~Dictionary();

};
        
#endif
