
TEST (AddressInput, DefaultValue) {
	AddressInput  ai;
	ASSERT_EQ (false, ai.IsFocused());
	ai.SetFocused(true);
	ASSERT_EQ (true, ai.IsFocused());
	ASSERT_EQ (true, ai.GetValue().empty());
}

TEST (AddressInput, BuildTest) {
	AddressInput  ai;
	auto v ="";
	auto tv = ai.GetValue();
	EXPECT_EQ(tv, v);	
}

TEST (AddressInput, OperationTest) {
	AddressInput  ai;
	string addr = "";
	ai.SetValue(addr);
	EXPECT_EQ(ai.GetValue(), addr);

	addr = "1515 Street Name Suite 123 NewYork, NY 98001 USA";
	ai.SetValue(addr);
	EXPECT_EQ(ai.GetValue(), addr);

	addr = "5555 Street Name  NewYork, NY 98001 USA";
	EXPECT_NE(ai.GetValue(), addr);
}

TEST (EndDateInputTest, Constructs){
	EndDateInput ei;
	
	auto v = ei.GetValue();
	date eday = boost::gregorian::day_clock::local_day();
	eday += date_duration(1);

	auto endDate = AppMisUtils::date_to_str2(eday);
	EXPECT_EQ(v, endDate);
}

TEST (EndDateInputTest, Operations){
	EndDateInput ei;
	string dt= "01/12/2016";
	ei.SetValue(dt);
	auto v = ei.GetValue();
	EXPECT_EQ(dt, v);
	
	dt= "01/Jun/2016";
	ei.SetValue(dt);
	v =  ei.GetValue();
	EXPECT_EQ(v, dt);


	//cannot be null
	dt= "";
	ei.SetValue(dt);
	EXPECT_EQ(ei.GetValue(), dt);
}

TEST (StartDateInputTest, Constructs){
	StartDateInput si;
	
	auto v = si.GetValue();
	date eday = boost::gregorian::day_clock::local_day();

	auto startDate = AppMisUtils::date_to_str2(eday);
	EXPECT_EQ(v, startDate);
}

TEST (StartDateInputTest, Operations){
	StartDateInput si;
	string dt= "11/12/2016";

	si.SetValue(dt);
	EXPECT_EQ(dt, si.GetValue());

	dt= "01/12/2016";
	EXPECT_NE(dt, si.GetValue());

	dt= "";
	si.SetValue(dt);
	EXPECT_EQ(dt, si.GetValue());
}

TEST (RediusInputTest, Constructs){
	RadiusInput ri;

	EXPECT_EQ("1.0", ri.GetValue());
}

TEST (RediusInputTest, Operations){
	RadiusInput ri;

	ri.SetValue("0.0");
	EXPECT_EQ("0.0", ri.GetValue());

	ri.SetValue("ABC");
	EXPECT_EQ(ri.GetValue(), "ABC");

	ri.SetValue("40.0");
	EXPECT_EQ(ri.GetValue(), "40.0");

	ri.SetValue("");
	EXPECT_EQ("", ri.GetValue());
}


TEST (CategoryInputTest, Constructs){
	CategoryInput ci;
	
	auto v = ci.GetValue();	
	EXPECT_EQ(v, "music");
}

TEST (CategoryInputTest, Operations){
	CategoryInput ci;

	ci.SetValue("Sports");
	auto v = ci.GetValue();
	ASSERT_EQ(v, "Sports");
}

