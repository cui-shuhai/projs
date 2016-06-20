
#include "CurlClient.hpp"
#include "View.hpp"


void View::AttachData(std::shared_ptr<CurlClient> sd)
{
	data = sd;
}

void View::Display()
{}


View::View() = default;

View::~View() = default;


