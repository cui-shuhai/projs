
#include "WordFinder.h"

WordFinder::WordFinder():dict{nullptr} {
}

WordFinder::~WordFinder(){
}

void WordFinder::SetDictionary(shared_ptr<Dictionary> d){
    dict = d;
}
