#ifndef __SONAR_PG_H__
#define __SONAR_PG_H__


#define FLOAT8ARRAYOID 1022


#define makeSonarNode(_type_) ((_type_ *) sp_new_node(sizeof(_type_),T_##_type_))

char ** sp_get_text_array_contents(ArrayType *array, int *numitems, char ***ts );
bool sonar_has_join_restriction ( PlannerInfo * root, RelOptInfo * rel );

const char* sonar_timestamp_out( Timestamp ts ) ;

const char * sonar_generate_operator_name ( Oid operid, Oid arg1, Oid arg2 ) ;
const char * sp_get_opname(Oid opno);

const char* sp_get_attname ( Oid relid, AttrNumber attnum );

void sp_get_sortgroupref_tle ( Index sortref,
                        List * targetList,
                        TargetEntry** tle ); 

Numeric sp_float8_to_numeric( float8	v );

Oid sp_rel_id( PlannerInfo *root, RelOptInfo * rel );
bool sp_is_array( Oid t );


Var * sp_find_var( PlannerInfo *root , Param * param );

Node * sp_new_node( int size, NodeTag  tag );

Var * sp_copy_var(const Var *var);

TargetEntry* sp_copy_tle(TargetEntry *var);

void sp_suspend_signal( int signal, struct sigaction *old );
void sp_resume_signal( int signal, struct sigaction *old );

double sonar_const_to_scalar( const Const *c );
#endif
