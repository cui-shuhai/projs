cmake_minimum_required(VERSION 2.8.0)
# 1. name of project
project(suco_suv)

#setting variable then, ${varname}
SET( src_dir, "C:\\soco_projs\\soco_suv" )
SET( output_dir, C:\\soco_projs\\soco_suv\\Debug )


# 2.no subdirectory
#add_subdirectory (Hello)

# add ing additional find package



set(CMAKE_AUTOMOC ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
find_package(Qt5 COMPONENTS Widgets Declarative)
# ${Qt5Widgets_INCLUDE_DIRS}
# ${Qt5Widgets_LIBRARIES}
# ${Qt5Declarative_INCLUDE_DIRS}
# ${Qt5Declarative_LIBRARIES}

set(CMAKE_PREFIX_PATH $ENV{QTDIR}) 

#4.  Make sure the compiler can find include files from our Hello library.
include_directories (${src_dir})
include_directories ( ../soco_suv )
include_directories ('../../boost_1_54_0' )
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtMultimediaWidgets')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtMultimedia')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtWidgets')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtXml')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtNetwork')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtGui')
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/include/QtCore')
include_directories (release)
include_directories ('../../Qt/Qt5.1.1/5.1.1/mingw48_32/mkspecs/win32-g++')



add_definitions(${Qt5Widgets_DEFINITIONS})
set(CMAKE_CXX_FLAGS "${Qt5Widgets_EXECUTABLE_COMPILE_FLAGS}")

# Make sure the linker can find the libraries
link_directories (${src_dir}/../bin/bin_release)
link_directories (C:\\Qt\\Qt5.1.1\\5.1.1\\mingw48_32\\lib)
link_directories (C:\\soco_projs\\build-soco_suv-Desktop_Qt_5_1_1_MinGW_32bit-Debug\\release)


# 5. Add executable called "helloDemo" that is built from the source files
# "demo.cxx" and "demo_b.cxx". The extensions are automatically found.
add_executable (soco_suv sc_suv.cpp  vplayer.cpp vplayer.h panelwnd.cpp  panelwnd.h contrlbar.cpp contrlbar.h channels.cpp channels.h soco_wnd.cpp  soco_wnd.h )


#6.  Link the executable to the libraries
#target_link_libraries (soco_suv glu32 opengl32 gdi32 user32 mingw32 qtmain kernel32 Qt5MultimediaWidgets Qt5Multimedia Qt5Widgets Qt5Xml Qt5Network Qt5Gui Qt5Core )
target_link_libraries (soco_suv glu32 opengl32 gdi32 user32 mingw32 qtmain kernel32 Qt5MultimediaWidgets Qt5Multimedia Qt5Widgets Qt5Xml Qt5Network Qt5Gui Qt5Core ${Qt5Widgets_LIBRARIES} )

