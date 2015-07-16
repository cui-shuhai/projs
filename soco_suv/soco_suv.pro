QT += network \
      xml \
      multimedia \
      multimediawidgets \
      widgets  \
      opengl


SOURCES += \
    sc_suv.cpp \
    contrlbar.cpp \
    soco_wnd.cpp \
    sc_exception.cpp \
    sc_code_decode.cpp \
    sc_decoder.cpp \
    sc_encoder.cpp \
    sc_av_work_around.c \
 #   sc_player.cpp \
    sc_qt_player.cpp \
    left_pane.cpp \
    sc_sites.cpp \
    sc_helper.c \
    sc_read_thread.cpp \
    sc_video_thread.cpp \
    sc_site_refresh.cpp

OTHER_FILES += \
    ps_1.txt \
    ps_3_midea_process.txt \
    ps_2main_window.txt \
    ps_4cmakelist_generator.txt \
    CMakeList.txt \
    build_qt.txt \
    ps_5buglist.txt \
    ps_6SDL_QT.txt \
    ps_7avcodecod.txt \
    build_qt_with_mingw.txt \
    build_ffmpeg_with_mingw.txt \
    ps_8qt_display_video.txt

HEADERS += \
    contrlbar.h \
    soco_wnd.h \
    miss_def.h \
    sc_exception.h \
    sc_code_decode.h \
    sc_decoder.h \
    sc_encoder.h \
    ffplay_define.h \
#    sc_player.h \
    sc_qt_player.h \
    left_pane.h \
    sc_sites.h \
    sc_helper.h \
    sc_read_thread.h \
    sc_video_thread.h \
    sc_site_refresh.h

INCLUDEPATH += "C:\boost_1_54_0" \
               C:\soco_projs\sc_cc\ffmpeg_libav\include
             #  C:\soco_projs\sc_cc\SDL2\include \
             #  C:\soco_projs\sc_cc\SDL_IMG2\include \
             #  C:\soco_projs\sc_cc\SDL2\src\render


LIBS += -LC:\Qt\Qt5.1.1\Tools\QtCreator\bin  -lQt5Core -lQt5Gui \
        -LC:\soco_projs\sc_cc\ffmpeg_libav\lib  -lavformat \
             -lavcodec -lavutil  -lavdevice  -lswscale -lswresample  -lavfilter



DEFINES += DEBUG

QMAKE_CXXFLAGS += -D__STDC_CONSTANT_MACROS
