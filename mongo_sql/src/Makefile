CC ?= gcc

#EXT_LIB = /usr/local/lib
EXT_LIB = ../extern/lib
EXT_INCLUDE = ../extern/include
#EXT_INCLUDE = /usr/local/include

MODULE_big = sonar_fdw
OBJS = sonar_fdw.o sonar_utils.o  sonar_nm.o sonar_agg.o sonar_distinct.o  sonar_query.o  sonar_order.o sonar_restriction.o sonar_unit.o sonar_group.o sonar_tts.o sonar_pg.o sonar_log.o sonar_mis.o sonar_outstretch.o sonar_path.o sonar_bson.o sonar_mongo.o sonar_func.o sonar_join.o sonar_subquery.o sonar_project.o sonar_option.o sonar_list.o sonar_xsub.o sonar_fbson.o


PG_CPPFLAGS =  -std=c11 -DMONGOC_COMPILATION -I$(libpq_srcdir) -I$(EXT_INCLUDE)/libbson-1.0 -I$(EXT_INCLUDE)/libmongoc-1.0
SHLIB_LINK = $(libpq)
SHLIB_LINK += -Bstatic -L$(EXT_LIB) -lmongoc-1.0 -lmongoc-priv -lbson-1.0 -Bdynamic -lssl -lcrypto -lsasl2
SHLIB_PREREQS = submake-libpq

EXTENSION = sonar_fdw
DATA = sonar_fdw--1.0.sql

REGRESS = sonar_fdw

# the db name is hard-coded in the tests
override USE_MODULE_DB =

ifdef PG_SRCDIR
	top_builddir = $(PG_SRCDIR)
	include $(top_builddir)/src/Makefile.global
	include $(top_builddir)/contrib/contrib-global.mk
else
	PG_CONFIG ?= pg_config
	PGXS := $(shell $(PG_CONFIG) --pgxs)
	include $(PGXS)
endif

sonar-test: sonar_utils.h sonar_utils.c sonar-test.c 
	$(CC) -g sonar_utils.c sonar-test.c -lmongoc -o sonar-test

#will check mongoc lib and build install it
#MONGODIR = ./mongo-c-driver-1.0.0


