#ifndef __DICTIONARY_FACTORY_H__
#define __DICTIONARY_FACTORY_H__


#include "Dictionary.h"
#include "WordFinder.h"

class DictionaryFactory{
    public:
        DictionaryFactory();
        ~DictionaryFactory();
        Dictionary * MakeDictionary(string name);
        // WordFinder* MakeWordFinder(string name);
};


#endif
