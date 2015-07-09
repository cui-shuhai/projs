/*-------------------------------------------------------------------------
 *
 * sonar_list.h
 *	  This is a variety of postgres pg_list.h which implements similar
 * functions but in its own context ( global memory ), not query memory
 * context. 
 *    This change avoids lots of postgres memory management problems
 * which usually caulses segment fault. Espacially query via cursors.
 *
 * Date: Fri Dec 19 11:28:39 PST 2014
 * Author : CUI, SHU HAI
 * 
 *-------------------------------------------------------------------------
 */
#ifndef __SONAR_LIST_H__
#define __SONAR_LIST_H__


List *
sl_var_list_copy(const List *oldlist);

List *
sl_tle_list_copy(const List *oldlist);

void
sl_list_free(List *list);

void
sl_list_free_deep(List *list);

void
sl_list_free_all(List *list);

List *
sl_lappend(List *list, void *datum);


#endif   /* __SONAR_LIST_H__ */
