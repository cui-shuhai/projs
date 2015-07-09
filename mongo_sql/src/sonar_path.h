/*
 * sonar_path.h
 * 
 * API for creating SQL paths to tell postgres what index we have
 * which is only useful when there is join query and there exists indexes.
 *  Create on: Thu Aug 14 16:03:53 PDT 2014
 *  Author: CUI, Shu Hai
 */
#ifndef __SONAR_PATH_H__
#define __SONAR_PATH_H__


List * sj_keys( PlannerInfo *root, 
        RelOptInfo * baserel,
        Oid foreigntableid);


PathKey * sonar_create_pathkey( PlannerInfo *root );

#endif
