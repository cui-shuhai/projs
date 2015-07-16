#ifndef SC_ENCODER_H
#define SC_ENCODER_H

#include "sc_code_decode.h"

class sc_encoder : public sc_code_decode
{
public:
    sc_encoder();
    ~sc_encoder();

    // url : either file or network address
    int sc_open( string url);
    int sc_read( AVFrame **ppF );
    int sc_has_more();

};

#endif // SC_ENCODER_H
