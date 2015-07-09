QT += network \
      xml \
      multimedia \
      multimediawidgets \
      widgets  \
      opengl

CONFIG += static

INCLUDEPATH +=  \
               C:\Users\scui\Desktop\soco_projs_qt\sc_cc\ffmpeg_libav\  \
               C:\Users\scui\Desktop\soco_projs_qt\soco_suv\sc_ffmpeg \
              C:\Users\scui\Desktop\soco_projs_qt\sc_cc\SDL-1.2.15\include\SDL  \


LIBS += \
        -LC:\Users\scui\Desktop\soco_projs_qt\sc_cc\SDL-1.2.15\lib -lSDL   \
        -LC:\Users\scui\Desktop\soco_projs_qt\sc_cc\ffmpeg_libav\lib  -lavformat \
             -lavcodec -lavutil  -lavdevice  -lswscale -lswresample  -lavfilter  \
        -LC:\soco_projs\sc_cc\ffmpeg_libav\lib  -lavformat \
             -lavcodec -lavutil  -lavdevice  -lswscale -lswresample  -lavfilter -lavformat \
             -lmp3lame -lopus -lx264  -lavutil \

SOURCES += \
    ffplay.c \
    cmdutils.c

HEADERS += \
    cmdutils_common_opts.h \
    cmdutils.h \
    config.h
