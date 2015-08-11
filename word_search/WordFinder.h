#ifndef __WORD_FINDER_H__
#define __WORD_FINDER_H__

#include <string>

using namespace std;

class WordFinder{
    
    public:
        WordFinder();
        virtual ~WordFinder();

        virtual void Find(string item) = 0;
    protected:

};

#endif

