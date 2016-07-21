#pragma once

#include "SqlAccessor.h"

class SqlAccessFactory{

public:
	static unique_ptr<SqlAccessor> CreateAccessor(string accessor_name, const string &table_name);
};
