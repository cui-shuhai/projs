
TEST (EmptyVerifcationTest, EmptyTest){
	InputEmptyChecker ec;
	auto eptstr = "";
	AddressInput addr;
	
	addr.SetValue(eptstr);
	EXPECT_FALSE(ec.Validate(addr));

	RadiusInput radius;
	radius.SetValue(eptstr);
	EXPECT_FALSE(ec.Validate(radius));

	StartDateInput sdate;
	sdate.SetValue(eptstr);
	EXPECT_FALSE(ec.Validate(sdate));

	EndDateInput eDate;
	eDate.SetValue(eptstr);
	EXPECT_FALSE(ec.Validate(eDate));

	CategoryInput catg;
	catg.SetValue(eptstr);
	EXPECT_FALSE(ec.Validate(catg));
}

TEST (EmptyVerifcationTest, NotEmptyTest){
	
	InputEmptyChecker ec;
	auto eptstr = "dummy contest";
	AddressInput addr;
	
	addr.SetValue(eptstr);
	EXPECT_TRUE(ec.Validate(addr));

	RadiusInput radius;
	radius.SetValue(eptstr);
	EXPECT_TRUE(ec.Validate(radius));

	StartDateInput sdate;
	sdate.SetValue(eptstr);
	EXPECT_TRUE(ec.Validate(sdate));

	EndDateInput eDate;
	eDate.SetValue(eptstr);
	EXPECT_TRUE(ec.Validate(eDate));

	CategoryInput catg;
	catg.SetValue(eptstr);
	EXPECT_TRUE(ec.Validate(catg));
}

TEST (ValidityVerificationTest, InvalidTests){
	InputValidityChecker ic;
	auto dum_str = "Invalide_str_for_any_field";
	AddressInput addr;
	
	addr.SetValue(dum_str);
	EXPECT_FALSE(ic.Validate(addr));

	RadiusInput radius;
	radius.SetValue(dum_str);
	EXPECT_FALSE(ic.Validate(radius));

	StartDateInput sdate;
	sdate.SetValue(dum_str);
	EXPECT_FALSE(ic.Validate(sdate));

	EndDateInput eDate;
	eDate.SetValue(dum_str);
	EXPECT_FALSE(ic.Validate(eDate));

	CategoryInput catg;
	catg.SetValue(dum_str);
	EXPECT_FALSE(ic.Validate(catg));
}

	TEST (ValidityVerificationTest, DISABLE_ValidAddressTests){
	InputValidityChecker ic;
	AddressInput addr;
}
TEST (ValidityVerificationTest, ValidRadiusTests){
	InputValidityChecker ic;
	RadiusInput radius;
	
	radius.SetValue("-1");
	EXPECT_FALSE(ic.Validate(radius));

	radius.SetValue("400");
	EXPECT_FALSE(ic.Validate(radius));

	radius.SetValue("0");
	EXPECT_TRUE(ic.Validate(radius));

	radius.SetValue("300");
	EXPECT_TRUE(ic.Validate(radius));

	radius.SetValue("20");
	EXPECT_TRUE(ic.Validate(radius));

}
TEST (ValidityVerificationTest, ValidStartDateTests){
	InputValidityChecker ic;
	StartDateInput sdate;

	sdate.SetValue("32/01/2011");
	EXPECT_FALSE(ic.Validate(sdate));
	sdate.SetValue("33/14/2001");
	EXPECT_FALSE(ic.Validate(sdate));
	sdate.SetValue("12/13/2022");
	EXPECT_FALSE(ic.Validate(sdate));
	sdate.SetValue("1/0/1999");
	EXPECT_FALSE(ic.Validate(sdate));
	sdate.SetValue("0/2/2000");
	EXPECT_FALSE(ic.Validate(sdate));

}
TEST (ValidityVerificationTest, ValidEndDateTests){
	InputValidityChecker ic;
	EndDateInput edate;

	edate.SetValue("32/01/2011");
	EXPECT_FALSE(ic.Validate(edate));
	edate.SetValue("33/14/2001");
	EXPECT_FALSE(ic.Validate(edate));
	edate.SetValue("12/13/2022");
	EXPECT_FALSE(ic.Validate(edate));
	edate.SetValue("1/0/1999");
	EXPECT_FALSE(ic.Validate(edate));

}
TEST (ValidityVerificationTest, ValidStartEndDateTests){
	InputValidityChecker ic;
	auto sDate = make_shared<StartDateInput>();
	sDate->SetValue("25/06/2016");
	auto eDate = make_shared<EndDateInput>();
	eDate->SetValue("29/06/2016");
	sDate->SetWeakEnd(eDate);
	eDate->SetWeakStart(sDate);

	EXPECT_TRUE(ic.Validate(*sDate.get()));
	EXPECT_TRUE(ic.Validate(*eDate.get()));
}

TEST (ValidityVerificationTest, InvalidStartEndDateTests){
	InputValidityChecker ic;
	auto sDate = make_shared<StartDateInput>();
	auto eDate = make_shared<EndDateInput>();
	sDate->SetWeakEnd(eDate);
	eDate->SetWeakStart(sDate);
	sDate->SetValue("25/06/2016");
	eDate->SetValue("29/08/2016");

	//EXPECT_FALSE(ic.Validate(*sDate.get()));
	EXPECT_FALSE(ic.Validate(*eDate.get()));
}
TEST (ValidityVerificationTest, ValidCategoryTests){
	InputValidityChecker ic;

	CategoryInput catg;
	catg.SetValue("music");
	EXPECT_TRUE(ic.Validate(catg));

	catg.SetValue("Music");
	EXPECT_TRUE(ic.Validate(catg));

	catg.SetValue("running");
	EXPECT_FALSE(ic.Validate(catg));
}
/*

class InputValidityChecker : public InputVerifier 
{
public:
	InputValidityChecker() = default;
	~InputValidityChecker() = default;

public:
	bool Validate(const AddressInput &input) override;
	bool Validate(const RadiusInput &input) override;
	bool Validate(const StartDateInput &input) override;
	bool Validate(const EndDateInput &input) override;
	bool Validate(const CategoryInput &input) override;
};*/

