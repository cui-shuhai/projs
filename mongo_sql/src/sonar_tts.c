#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_nm.h"
#include "sonar_mis.h"
#include "sonar_restriction.h"
#include "sonar_tts.h"


TupleDesc sonar_create_group_ttsdesc( Oid id, List *l )
{
    int natts = list_length( l );
    AttrNumber attnum;
    TupleDesc desc;
    int attdim = 1;
	ListCell *c = NULL;
    Form_pg_attribute att;

    desc = CreateTemplateTupleDesc(natts, true); //true has tableOID
    desc->natts = natts;
    desc->constr = NULL;
    desc->tdtypeid = RECORDOID;
    desc->tdtypmod = -1;
    desc->tdrefcount = -1; /* assume not reference-counted */
    desc->tdhasoid = 0;
    attnum = 0;

    foreach( c, l )
    {
        TargetEntry *e = ( TargetEntry*)lfirst( c );
        
        const char* alias = e->resname;
        char  fn[NAMEDATALEN] = {0};

        Expr *expr = e->expr;
        Var * v;

        attnum++;
        att = desc->attrs[attnum - 1];

        att->attrelid = id;
        att->attnum = attnum;
        //att->attndims = attdim;
        att->attndims = 0;
        
        att->attnotnull = false;
        att->atthasdef = false;
        att->attisdropped = false;
        att->attislocal = true;
        att->attinhcount = 0;
        att->attstattarget = -1;
        att->attcollation = 100;

         namestrcpy(&(att->attname), alias );
        //sprintf( bf, "%d", e->resno );

        if( IsA( expr, Var ) )
        {
            v = ( Var* ) expr;
            sprintf( fn, "_id.%s", alias );
            att->atttypid = v->vartype;
            att->atttypmod = v->vartypmod;
        }
        else if( IsA ( expr, Aggref ) )
        {
            Aggref *ag = ( Aggref * ) expr;
            if( ag->args )
            {
                TargetEntry *ae = ( TargetEntry*)lfirst( ag->args->head );
                v = (Var*)ae->expr;
                if( alias )
                    sprintf( fn, "%s", alias );
                else
                    sprintf( fn, "dummy%d", ae->resno );
                att->atttypmod = v->vartypmod;
                att->atttypid = v->vartype;
            }
            else
            {

                att->atttypmod = -1;
                att->atttypid = ag->aggtype;
            }

            att->atttypid = ag->aggtype;

        }
        else if( IsA ( expr, FuncExpr ) )
        {
            FuncExpr *func = (FuncExpr*) expr;
            Aggref *ag;
            if( func->args )
            {
                ListCell *fc = 0;
                foreach( fc, func->args )
                {

                    Expr *xr = lfirst( fc );

                    if( IsA( xr, Aggref ) )
                    {
                        ag = ( Aggref * ) xr;

                        sprintf( fn, "%s", alias );

                        if( ag && ag->args )
                        {
                            TargetEntry *ae;
                            ae = ( TargetEntry*)lfirst( ag->args->head );
                            v = (Var*)ae->expr;
                            att->atttypmod = v->vartypmod;

                        }
                        else
                        {
                            att->atttypmod = -1;
                        }
                    }
                    else
                    {
                        // not supported  yet
                        
                        att->atttypmod = -1;
                    }
                }
            }

            att->atttypid = func->funcresulttype ;
        }

        get_typlenbyvalalign( att->atttypid, &att->attlen, &att->attbyval, &att->attalign);

    }

    return desc;
}
    
