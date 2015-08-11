
#include <iostream>
#include "EngDict.h"



EngDict::EngDict():tree{make_shared<WordTree>()}{
}

EngDict::~EngDict(){
}


/*The is used to build dictionary*/

void EngDict::AddWord(string w){
    char *p = const_cast<char*>(w.c_str());

    shared_ptr<WordTree> t = tree;

    while (*p != '\0'){
        if (!(t->wnodes[*p - 'a']))
             t->wnodes[*p - 'a'] = make_shared<WordTree>();
        if (*(p + 1) == '\0'){
            t->wnodes[*p - 'a']->flag = 1; 
        }
        else {

            t = t->wnodes[*p - 'a'];
        }

        p++;
    }
}

/* check to see if word w is in the idctionary */
bool EngDict::FindWord(string w){
    char *p = const_cast<char*>(w.c_str());
    shared_ptr<WordTree> t = tree;

    while (*p != '\0'){
        if (!(t->wnodes[*p - 'a'])){
            cout << "no such word" << endl;
             
            if (*(p + 1) == '\0' && t->wnodes[*p - 'a']->flag)
            return true;
        }
        p++;
    }

    return false;
}

/* This outputs all the words contains in w with same start */
void EngDict::FindWords(string w){
    char *p0 = const_cast<char*>(w.c_str());
    char *p = const_cast<char*>(w.c_str());

    shared_ptr<WordTree> t = tree;

    while (*p != '\0'){
        if (!(t->wnodes[*p - 'a'])){
            return;
        }
             
        if (*(p + 1) == '\0' && t->wnodes[*p -'a']->flag){
           
           cout << w.substr(0, p +1 - p0) << endl;
        }

        t = t->wnodes[*p -'a'];
        p++;
    }
}

