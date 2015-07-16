#ifndef SC_SDL_PALYER_H
#define SC_SDL_PALYER_H

#include <boost/shared_ptr.hpp>
using namespace boost;

#ifdef __cplusplus
extern "C" {
#endif

#include "config.h"
#include <inttypes.h>
#include <math.h>
#include <limits.h>
#include <signal.h>
#include "libavutil/avstring.h"
#include "libavutil/colorspace.h"
#include "libavutil/mathematics.h"
#include "libavutil/pixdesc.h"
#include "libavutil/imgutils.h"
#include "libavutil/dict.h"
#include "libavutil/parseutils.h"
#include "libavutil/samplefmt.h"
#include "libavutil/avassert.h"
#include "libavutil/time.h"
#include "libavformat/avformat.h"
#include "libavdevice/avdevice.h"
#include "libswscale/swscale.h"
#include "libavutil/opt.h"
#include "libavcodec/avfft.h"
#include "libswresample/swresample.h"
#include "libavutil/channel_layout.h"
#include "libavfilter/avfilter.h"

#ifdef __cplusplus
}
#endif
#include <string>
using namespace std;

#include <SDL_sysrender.h>
#include <SDL.h>
#include <SDL_rect.h>
#include <SDL_video.h>
#include <SDL_thread.h>
#include <SDL_events.h>

#include <QVBoxLayout>

#undef main
#include <QWidget>

#include "ffplay_define.h"
#include "sc_decoder.h"
#include "sc_player.h"


class sc_sdl_player : public sc_player
{
    Q_OBJECT
public:
    explicit sc_sdl_player(QWidget *parent = 0);
    ~sc_sdl_player();

    static void InitOnce( );
    static int64_t get_valid_channel_layout(int64_t channel_layout, int channels)
    {
        if (channel_layout && av_get_channel_layout_nb_channels(channel_layout) == channels)
            return channel_layout;
        else
            return 0;
    }
   void fill_rectangle(SDL_Surface *screen,
                      int x, int y, int w,
                      int h, int color, int update)
{
    SDL_Rect rect;
    rect.x = x;
    rect.y = y;
    rect.w = w;
    rect.h = h;

    SDL_FillRect(screen, &rect, color);
    if (update && w > 0 && h > 0)
    {
    SDL_Renderer *soft_render = SDL_CreateSoftwareRenderer( screen );
    SDL_RenderDrawRect( soft_render, &rect );
    }
}


    /* draw only the border of a rectangle */
    void fill_border(int xleft, int ytop, int width, int height,
                        int x, int y, int w, int h, int color,
                        int update);





    void do_exit();
    void sigterm_handler(int sig);

   // int video_open( int force_set_video_mode, VideoPicture *vp);



    void duplicate_right_border_pixels(SDL_Texture *bmp);

    void stream_cycle_channel( int codec_type);

    void toggle_full_screen();
    void change_channel( string new_url );

    static int event_loop( void * );
    void stream_component_close( int stream_index);
    void alloc_picture(sc_sdl_player *plr);
    void refresh_loop_wait_event(sc_sdl_player *plr, SDL_Event* event );
    int play();
    void start();
    void video_image_display();
signals:

public slots:


public:
    SDL_Window * pSdlWnd;
    string window_title;    

    SDL_Renderer *render;
    SDL_Surface *screen;

    int screen_width ;
    int screen_height;
    int64_t cursor_last_shown;
    int cursor_hidden;
    string dummy_videodriver;//[] = "SDL_VIDEODRIVER=dummy";

    shared_ptr< VideoState > sp_is;
};
#endif // SC_SDL_PALYER_H
