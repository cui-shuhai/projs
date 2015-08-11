
#include "EngDict.h"
#include "AllWordFinder.h"
#include "DictionaryFactory.h"


DictionaryFactory::DictionaryFactory(){
}

DictionaryFactory::~DictionaryFactory(){
}

Dictionary * DictionaryFactory::MakeDictionary(string name){

    if (name == "english_US")
        return new EngDict();

    return nullptr;
}

/*
WordFinder * MakeWordFinder(string name){

    if (name == "AllWordFinder")
        return new AllWordFinder();

    return nullptr;
}
*/
