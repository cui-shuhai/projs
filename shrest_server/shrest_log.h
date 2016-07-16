#pragma once

#include <iostream>
//#define LOG(msg)    std::cout << __FILE__ << "(" << __LINE__ << "): " << msg << std::endl 

#define LOG(...) std::cout << __FILE__ << "(" << __LINE__ << "): "; log(__VA_ARGS__)



template< typename One, typename Two, typename Three, typename Four, typename Five>
void log(One one, Two two, Three three, Four four, Five five){

	std::cout << one << "" << two  << " " << three << " " << four << " " << five << std::endl;	
}

template< typename One, typename Two, typename Three, typename Four>
void log(One one, Two two, Three three, Four four){

	std::cout << one << "" << two  << " " << three << " " << four << std::endl;	
}

template< typename One, typename Two, typename Three>
void log(One one, Two two, Three three){

	std::cout << one << "" << two  << " " << three << std::endl;	
}
template< typename One, typename Two>
void log(One one, Two two){

	std::cout << one << "" << two  << std::endl;	
}

template< typename One>
void log(One one){

	std::cout << one << std::endl;	
}
