
/*! sonar_subquery.h 
 *  subquery helper api definitons
 *
 * Date: : Wed Sep 17 10:15:21 PDT 2014
 * Author : CUI, SHU HAI
 */

#ifndef __SONAR_SUBQUERY_H__
#define __SONAR_SUBQUERY_H__

bool ss_is_subquery(PlannerInfo *root,
                   RelOptInfo *baserel,
                   psc_private priv);

bool ss_is_outquery(PlannerInfo *root,
                   RelOptInfo *baserel,
                   psc_private priv);


bool ss_subquery_private( 
        psc_private priv, 
        PlannerInfo **subroot );
#endif

