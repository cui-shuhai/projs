QT += network \
      xml \
      multimedia \
      multimediawidgets \
      widgets  \
      opengl


SOURCES += \
    ffmpeg_opt.c \
    ffmpeg.c \
    cmdutils.c \
    ffmpeg_filter.c

HEADERS += \
    ffmpeg.h \
    config.h \
    cmdutils.h \
    cmdutils_common_opts.h


INCLUDEPATH += "C:\boost_1_54_0" \
               C:\soco_projs\sc_cc\ffmpeg_libav\include


LIBS += -LC:\Qt\Qt5.1.1\5.1.1\mingw48_32\bin  -lQt5Core -lQt5Gui \
        -LC:\soco_projs\sc_cc\ffmpeg_libav\lib  -lavformat \
             -lavcodec -lavutil  -lavdevice  -lswscale -lswresample  -lavfilter  \
        -LC:\Qt\Qt5.1.1\Tools\mingw48_32\i686-w64-mingw32\lib  -lws2_32 \
             -LC:\soco_projs\sc_cc\ffmpeg_libav\lib -lswresample -lavcodec -lpostproc \
                -lavformat -lavutil -lmp3lame -lopus -lx264 -lavformat -lavutil \
         -LC:\Qt\Qt5.1.1\Tools\mingw48_32\i686-w64-mingw32\lib -lavicap32 -lws2_32 \

