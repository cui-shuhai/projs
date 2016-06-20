#include "InputEmptyChecker.hpp"
#include "InputValidityChecker.hpp"
#include "AddressInput.hpp"

#include "gtest/gtest.h"
 
 
TEST (AddressInput, DefaultValue) {
	AddressInput  ai;
	ASSERT_EQ (false, ai.IsFocused());
	ai.SetFocused(true);
	ASSERT_EQ (true, ai.IsFocused());
	ASSERT_EQ (true, ai.GetValue().empty());
}

TEST (AddressInput, OperationTest) {
	AddressInput  ai;
	string addr = "";
	ai.SetValue(addr);
	ASSERT_EQ (0, ai.GetValue().compare(addr));

	addr = "1515 Street Name Suite 123 NewYork, NY 98001 USA";
	ai.SetValue(addr);
	ASSERT_EQ(0, ai.GetValue().compare(addr));
}
 
int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}


