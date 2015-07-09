/*-------------------------------------------------------------------------
 *
 * sonar_list.c
 * list management api implemented in dafault memory context
 *
 * Date: Fri Dec 19 11:28:39 PST 2014
 * Author : CUI, SHU HAI
 * 
 *-------------------------------------------------------------------------
 */

#include "sonar_utils.h"
#include "sonar_pg.h"
#include "sonar_list.h"

/*
 * Check that the specified List is valid (so far as we can tell).
 */
static void
check_list_invariants(const List *list)
{
	if (list == NIL)
		return;

	Assert(list->length > 0);
	Assert(list->head != NULL);
	Assert(list->tail != NULL);

	Assert(list->type == T_List ||
		   list->type == T_IntList ||
		   list->type == T_OidList);

	if (list->length == 1)
		Assert(list->head == list->tail);
	if (list->length == 2)
		Assert(list->head->next == list->tail);
	Assert(list->tail->next == NULL);
}

static void
sl_new_tail_cell(List *list)
{
	ListCell   *new_tail;

	new_tail = (ListCell *) malloc(sizeof(*new_tail));
	new_tail->next = NULL;

	list->tail->next = new_tail;
	list->tail = new_tail;
	list->length++;
}

/*
 * Free all storage in a list, and optionally the pointed-to elements
 */
static void
sl_list_free_private(List *list, bool deep)
{
	ListCell   *cell;

	check_list_invariants(list);

	cell = list_head(list);
	while (cell != NULL)
	{
		ListCell   *tmp = cell;

		cell = lnext(cell);
		if (deep)
			free(lfirst(tmp));
		free(tmp);
	}

	if (list)
		free(list);
}

/*
 * Return a freshly allocated List. Since empty non-NIL lists are
 * invalid, new_list() also allocates the head cell of the new list:
 * the caller should be sure to fill in that cell's data.
 */
static List *
sl_new_list(NodeTag type)
{
	List	   *new_list;
	ListCell   *new_head;

	new_head = (ListCell *) malloc(sizeof(*new_head));
	new_head->next = NULL;
	/* new_head->data is left undefined! */

	new_list = (List *) malloc(sizeof(*new_list));
	new_list->type = type;
	new_list->length = 1;
	new_list->head = new_head;
	new_list->tail = new_head;

	return new_list;
}
/*
 * Return a shallow copy of the specified list.
 */
List *
sl_var_list_copy(const List *oldlist)
{
	List	   *newlist = 0;
	ListCell   *oldlist_cur;

	if (oldlist == NIL)
		return NIL;

	//newlist = sl_new_list(oldlist->type);

    foreach( oldlist_cur, oldlist )
    {
        Var *oldv = (Var*)lfirst( oldlist_cur );
        Var *v = sp_copy_var( oldv );
        newlist = sl_lappend( newlist, v );
    }
	return newlist;
}

List *
sl_tle_list_copy(const List *oldlist)
{
	List	   *newlist = 0;
	ListCell   *oldlist_cur;

	if (oldlist == NIL)
		return NIL;

	//newlist = sl_new_list(oldlist->type);

    foreach( oldlist_cur, oldlist )
    {
        TargetEntry *oldv = (TargetEntry*)lfirst( oldlist_cur );
        TargetEntry *v = sp_copy_tle( oldv );
        newlist = sl_lappend( newlist, v );
    }
	return newlist;
}

void
sl_list_free(List *list)
{
	sl_list_free_private(list, false);
}

void
sl_list_free_deep(List *list)
{
	Assert(IsPointerList(list));
	sl_list_free_private(list, true);
}

List *
sl_lappend(List *list, void *datum)
{
	Assert(IsPointerList(list));

	if (list == NIL)
		list = sl_new_list(T_List);
	else
		sl_new_tail_cell(list);

	lfirst(list->tail) = datum;
	check_list_invariants(list);
	return list;
}
void
sl_list_free_all(List *list)
{
    ListCell *c;

    foreach( c, list )
    {
       void *node = lfirst( c );
       free( node );
    }

    sl_list_free( list );
}
