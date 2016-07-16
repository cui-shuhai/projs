


TEST (UtilisTest, StrToDate){
	auto date_str = "15/11/2016";

	date d;
	AppMisUtils::str_to_date(date_str, d);
}

TEST (UtilisTest, DateToStr){
	auto date_str = "15/11/2016";

	date d{2016, 11, 15};
	EXPECT_EQ(AppMisUtils::date_to_str(d), date_str);
}


TEST (UtilisTest, SplitStr){
	auto date_str = "15|Nov|2016";

	auto strv = AppMisUtils::split(date_str);
	auto rc = strv[0] == "15" && strv[1] == "Nov" && strv[2] == "2016";
	EXPECT_TRUE( rc && strv.size() == 3);
}

