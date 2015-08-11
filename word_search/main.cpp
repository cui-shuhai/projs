
#include <cstring>
#include <memory>
#include <iostream>
#include <vector>

#include "DictionaryFactory.h"
#include "Dictionary.h"
#include "EngDict.h"

using namespace std;

void PrintAllTermOfSearchString(shared_ptr<Dictionary> dict, char *item, int n){

    //print out all item for item
    dict->FindWords(string(item));

    if(n == 1)
        return;

    for(int i = 0; i < n-1; i++){
        if (item[i] != item[n-1]){
            char c = item[i];
            item[i] = item[n-1];
            item[n-1] =c;

            //print out all items of another possible form
            PrintAllTermOfSearchString(dict, item, n-1);
            item[n-1] = item[i];
            item[i] = c;
        }
    }

};

int main( int argc, char **argv){

    DictionaryFactory df;

    if (argc != 2){
        cout << "Usage:" << argv[0] << "search word" << endl;
        return -1;
    }

    shared_ptr<Dictionary> dict(df.MakeDictionary("english_US"));

    //populate all english words into tree;

    //let assumes all english words are in vectors<string> all_words;

    vector<string> all_words = { "abcd", "in", "out" };

    for(auto & v: all_words)
        dict->AddWord(v);

    //permutate string argv[1];

    int len = strlen(argv[1]);
    char *temp = static_cast<char*>( alloca(len + 1));


    strncpy(temp, argv[1], len +1);

    PrintAllTermOfSearchString(dict, temp, len);


}
