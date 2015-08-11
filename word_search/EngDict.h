//#include <vector>
#include <array>
#include <memory>

#include "Dictionary.h"

using namespace std;

struct WordTree{
    std::array<shared_ptr<WordTree>, 26> wnodes;
    int flag = 0;
};


class EngDict: public Dictionary{
    public:
        EngDict();
        ~EngDict();
        EngDict( const EngDict &) = delete;
        EngDict( EngDict &&) = delete;
        EngDict & operator = ( const EngDict &) = delete;
        EngDict & operator = ( EngDict &&) = delete;
        void AddWord(string w);
        bool FindWord(string w);
        void FindWords(string w);

    private:

        shared_ptr<WordTree> tree;
};
        

