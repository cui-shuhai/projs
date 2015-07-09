 --  Copyright 2013 jSonar Inc 
 --  All Rights Reserved.
 -- 
 -- NOTICE:  All information contained herein is, and remains
 -- the property of jSonar Incorporated and its suppliers,
 -- if any.  The intellectual and technical concepts contained
 -- herein are proprietary to jSonar Incorporated
 -- and its suppliers and may be covered by U.S. and Foreign Patents,
 -- patents in process, and are protected by trade secret or copyright law.
 -- Dissemination of this information or reproduction of this material
 -- is strictly forbidden unless prior written permission is obtained
 -- from jSonar Incorporated.


\echo To initialize sonar FDW, run "CREATE EXTENSION sonar_fdw". \quit


CREATE FUNCTION sonar_fdw_validator(text[], oid)
RETURNS void
AS 'MODULE_PATHNAME'
LANGUAGE C STRICT;

CREATE FUNCTION sonar_fdw_handler()
RETURNS fdw_handler
AS 'MODULE_PATHNAME'
LANGUAGE C STRICT;


CREATE FOREIGN DATA WRAPPER sonar_fdw
  HANDLER sonar_fdw_handler
  VALIDATOR sonar_fdw_validator;
