
#ifndef __ALL_WORD_FINDER_H__
#define __ALL_WORD_FINDER_H__

#include "WordFinder.h"

class AllWordFinder: public WordFinder{
    
    public:
        AllWordFinder();
        virtual ~AllWordFinder();

        void Find(string item);
};

#endif

