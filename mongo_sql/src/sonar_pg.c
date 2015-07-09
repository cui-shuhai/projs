#include "signal.h"
#include "sonar_utils.h"
#include "sonar_log.h"
#include "sonar_nm.h"

#include "sonar_pg.h"

static void EncodeSpecialTimestamp ( Timestamp dt, char * str );


static char* att_addlength( char* cur_offset, int16_t attlen, char* attptr );

bool sonar_has_join_restriction ( PlannerInfo * root, RelOptInfo * rel )
{
    ListCell *l;
    foreach(l, root->lateral_info_list)
    {
        LateralJoinInfo *ljinfo = (LateralJoinInfo *) lfirst(l);
        if (bms_is_subset(ljinfo->lateral_rhs, rel->relids) ||
            bms_overlap(ljinfo->lateral_lhs, rel->relids))
            return true;
    }
    foreach(l, root->join_info_list)
    {
        SpecialJoinInfo *sjinfo = (SpecialJoinInfo *) lfirst(l);
        /* ignore full joins --- other mechanisms preserve their ordering */
        if (sjinfo->jointype == JOIN_FULL)
            continue;
            /* ignore if SJ is already contained in rel */
        if (bms_is_subset(sjinfo->min_lefthand, rel->relids) &&
            bms_is_subset(sjinfo->min_righthand, rel->relids))
        continue;
        /* restricted if it overlaps LHS or RHS, but doesn't contain SJ */
        if (bms_overlap(sjinfo->min_lefthand, rel->relids) ||
            bms_overlap(sjinfo->min_righthand, rel->relids))
            return true;
    }
    return false;
}

const char* sonar_timestamp_out( Timestamp timestamp ) 
{
     char *result;
     struct pg_tm tt,
     *tm = &tt;
     fsec_t fsec;
     char buf[MAXDATELEN + 1];
     if (TIMESTAMP_NOT_FINITE(timestamp))
         EncodeSpecialTimestamp(timestamp, buf);
     else if (timestamp2tm(timestamp, NULL, tm, &fsec, NULL, NULL) == 0)
         EncodeDateTime(tm, fsec, false, 0, NULL, DateStyle, buf);
     else
         ereport(ERROR,
         (errcode(ERRCODE_DATETIME_VALUE_OUT_OF_RANGE),
         errmsg("timestamp out of range")));
     result = pstrdup(buf);
     return result;
}

void EncodeSpecialTimestamp ( Timestamp dt, char * str )
{
     if (TIMESTAMP_IS_NOBEGIN(dt))
         strcpy(str, EARLY);
     else if (TIMESTAMP_IS_NOEND(dt))
         strcpy(str, LATE);
     else /* shouldn't happen */
         elog(ERROR, "invalid argument for EncodeSpecialTimestamp");
}

/*
  * Deconstruct a text[] into C-strings (note any NULL elements will be
  * returned as NULL pointers)
  */
char **
sp_get_text_array_contents(ArrayType *array, int *numitems, char ***ts )
 {
	  int ndim = ARR_NDIM(array);
	  int *dims = ARR_DIMS(array);
	  int nitems;
	  int16 typlen;
	  bool typbyval;
	  char typalign;
	  char **values ;
	  char *ptr;
	  bits8 *bitmap;
	  int bitmask;
	  int i;
	 
	  Assert(ARR_ELEMTYPE(array) == TEXTOID);
	 
	  *numitems = nitems = ArrayGetNItems(ndim, dims);
	 
	  get_typlenbyvalalign(ARR_ELEMTYPE(array), &typlen, &typbyval, &typalign);
	 
	  values = (char **) malloc(nitems * sizeof(char *));

      *ts = values;
	 
	  ptr = ARR_DATA_PTR(array);
	  bitmap = ARR_NULLBITMAP(array);
	  bitmask = 1;
	 
	  for (i = 0; i < nitems; i++)
	  {
		  if (bitmap && (*bitmap & bitmask) == 0)
		  {
			  values[i] = NULL;
		  }
		  else
		  {
			  values[i] = TextDatumGetCString(PointerGetDatum(ptr));
			  //XXX ptr = att_addlength(ptr, typlen, ptr);
			  ptr = att_addlength_pointer(ptr, typlen, ptr);
			  ptr = att_align_nominal(ptr, typalign);
		  }
		 
		  /* advance bitmap pointer if any */
		  if (bitmap)
		  {
			  bitmask <<= 1;
			  if (bitmask == 0x100)
			  {
				  bitmap++;
				  bitmask = 1;
			  }
		  }
	  }
	 
	  return values;
 }

char* att_addlength( char*	cur_offset,
			 int16 attlen,
			 char* attptr ) 
 {
	 return
		 
		((attlen) > 0) ?  ( cur_offset + attlen ) 
			: ( (attlen == -1) ?  ( cur_offset + VARSIZE_ANY(attptr) ) 
					: ( AssertMacro(attlen == -2), cur_offset + (strlen((char *) attptr) + 1) ));

 }

const char * sonar_generate_operator_name ( Oid operid, Oid arg1, Oid arg2 ) 
{
    {
        StringInfoData buf;
        HeapTuple opertup;
        Form_pg_operator operform;
        char *oprname;
        char *nspname;
        Operator p_result;
        initStringInfo(&buf);
        opertup = SearchSysCache1(OPEROID, ObjectIdGetDatum(operid));
        if (!HeapTupleIsValid(opertup))
            elog(ERROR, "cache lookup failed for operator %u", operid);
            operform = (Form_pg_operator) GETSTRUCT(opertup);
            oprname = NameStr(operform->oprname);
            /*
            * The idea here is to schema-qualify only if the parser would fail to
            * resolve the correct operator given the unqualified op name with the
            * specified argtypes.
            */
            switch (operform->oprkind)
            {
                case 'b':
                p_result = oper(NULL, list_make1(makeString(oprname)), arg1, arg2,
                true, -1);
                break;
                case 'l':
                p_result = left_oper(NULL, list_make1(makeString(oprname)), arg2,
                true, -1);
                break;
                case 'r':
                p_result = right_oper(NULL, list_make1(makeString(oprname)), arg1,
                true, -1);
                break;
                default:
                elog(ERROR, "unrecognized oprkind: %d", operform->oprkind);
                p_result = NULL; /* keep compiler quiet */
                break;
            }
            if (p_result != NULL && oprid(p_result) == operid)
                nspname = NULL;
                else
                {
                    nspname = get_namespace_name(operform->oprnamespace);
                    appendStringInfo(&buf, "OPERATOR(%s.", quote_identifier(nspname));
                }
                appendStringInfoString(&buf, oprname);
                if (nspname)
                    appendStringInfoChar(&buf, ')');
                    if (p_result != NULL)
                        ReleaseSysCache(p_result);
                        ReleaseSysCache(opertup);
                        return buf.data;
    }
   
}


/*
 * sonar_get_opname
 *        returns the name of the operator with the given opno
 *
 * Note: returns a palloc'd copy of the string, or NULL if no such operator.
 */
const char *
sp_get_opname(Oid opno)
{
        HeapTuple       tp;
        tp = SearchSysCache1(OPEROID, ObjectIdGetDatum(opno));
        if (HeapTupleIsValid(tp))
        {
                Form_pg_operator optup = (Form_pg_operator) GETSTRUCT(tp);
                char *result;
                int len = strlen( optup->oprname.data ); 

                result = (char * )malloc( len +1 );

                memset( result, 0, len + 1 );

                memcpy( result, optup->oprname.data, len );

                ReleaseSysCache(tp);
                return result;
        }
        else
                return NULL;
}

const char* sp_get_attname ( Oid relid, AttrNumber attnum )
{
     HeapTuple tp;
     tp = SearchSysCache2(ATTNUM,
     ObjectIdGetDatum(relid),
     Int16GetDatum(attnum));
     if (HeapTupleIsValid(tp))
     {
        Form_pg_attribute att_tup = (Form_pg_attribute) GETSTRUCT(tp);
        char *result;
        int len = strlen( att_tup->attname.data );

        result = (char * )malloc( len +1 );
        memset( result, 0, len + 1 );
        memcpy( result, att_tup->attname.data, len );

        ReleaseSysCache(tp);
        return result;
     }
     else
         return NULL;
}

void sp_get_sortgroupref_tle ( Index sortref,
                        List * targetList,
                        TargetEntry** tle )
{
    ListCell *l;
    foreach(l, targetList)
    {
         TargetEntry *te = (TargetEntry *) lfirst(l);
         if (te->ressortgroupref == sortref)
         {
             *tle = te;
         }
    }
}

Numeric sp_float8_to_numeric( float8	v )
{
	 Datum d = Float8GetDatum(v);
	 return DatumGetNumeric(DirectFunctionCall1(float8_numeric, d));
}

Oid sp_rel_id( PlannerInfo *root, RelOptInfo * rel )
{
    Index scan_relid = rel->relid;
    RangeTblEntry *rte;
    Assert(scan_relid > 0);
    Assert(rel->rtekind == RTE_RELATION);
    rte = planner_rt_fetch(scan_relid, root);
    Assert(rte->rtekind == RTE_RELATION);
    return rte->relid;
}

bool sp_is_array( Oid t )
{
    return true;
}

Var * sp_find_var( PlannerInfo *root , Param * param )
{
    if( root->plan_params )
    {
        ListCell *ppl;
        foreach(ppl, root->plan_params)
        {
             PlannerParamItem *pitem = (PlannerParamItem *) lfirst(ppl);
             if ( param->paramid == pitem->paramId && IsA(pitem->item, Var))
             {
                 Var *pvar = (Var *) pitem->item;
                 return pvar;
            }
        }
    }

    return 0;
}

Node * sp_new_node( int size, NodeTag  tag )
{
    Node *_result;
    AssertMacro((size) >= sizeof(Node)); /* need the tag, at least */ 
    _result = (Node *) malloc(size);
    memset( _result, 0, size );
    _result->type = (tag); \
    return _result;
}

Var *
sp_copy_var(const Var *var)
{
	Var		   *newvar = (Var *)makeSonarNode( Var ); 

    newvar->varno = var->varno;
    newvar->varattno = var->varattno;
    newvar->vartype = var->vartype;
    newvar->vartypmod = var->vartypmod;
    newvar->varcollid = var->varcollid;
    newvar->varlevelsup = var->varlevelsup;
    newvar->varno = var->varno;
    newvar->varoattno = var->varoattno;
    newvar->location = var->location;

	return newvar;
}

TargetEntry* sp_copy_tle(TargetEntry *old)
{
	TargetEntry *tle = makeSonarNode(TargetEntry);

	tle->expr = old->expr;
	tle->resno = old->resno;
	tle->resname = old->resname;
	tle->ressortgroupref = old->ressortgroupref;
	tle->resorigtbl = old->resorigtbl;
	tle->resorigcol = old->resorigcol;
	//tle->resjunk = old->resjunk;
	tle->resjunk = 0;

	return tle;
}

void sp_suspend_signal( int signal, struct sigaction *old_action )
{
    struct sigaction new_action;

    new_action.sa_handler = SIG_IGN;
    sigemptyset (&new_action.sa_mask);
    new_action.sa_flags = 0;

    sigaction (signal, NULL, old_action);

    if (old_action->sa_handler != SIG_IGN)
        sigaction (signal, &new_action, NULL);
}

void sp_resume_signal( int signal, struct sigaction *old_action )
{
    if (old_action->sa_handler != SIG_IGN)
        sigaction (signal, old_action, NULL);
}

double sonar_const_to_scalar( const Const *c )
{
    switch (c->consttype)
    {
        case BOOLOID:
        return (double) DatumGetBool(c->constvalue);
        case INT2OID:
        return (double) DatumGetInt16(c->constvalue);
        case INT4OID:
        return (double) DatumGetInt32(c->constvalue);
        case INT8OID:
        return (double) DatumGetInt64(c->constvalue);
        case FLOAT4OID:
        return (double) DatumGetFloat4(c->constvalue);
        case FLOAT8OID:
        return (double) DatumGetFloat8(c->constvalue);
        case NUMERICOID:
        /* Note: out-of-range c->constvalues will be clamped to +-HUGE_VAL */
        return (double)
        DatumGetFloat8(DirectFunctionCall1(numeric_float8_no_overflow,
        c->constvalue));
        case OIDOID:
        case REGPROCOID:
        case REGPROCEDUREOID:
        case REGOPEROID:
        case REGOPERATOROID:
        case REGCLASSOID:
        case REGTYPEOID:
        case REGCONFIGOID:
        case REGDICTIONARYOID:
        /* we can treat OIDs as integers... */
        return (double) DatumGetObjectId(c->constvalue);
    }
    /*
    * Can't get here unless someone tries to use scalarltsel/scalargtsel on
    * an operator with one numeric and one non-numeric operand.
    */
    elog(ERROR, "unsupported type: %u", c->consttype);
    return 0; 
}
