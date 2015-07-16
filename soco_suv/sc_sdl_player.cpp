extern "C" {

#include "libavutil/avutil.h"
}


#include <boost/shared_ptr.hpp>

using namespace boost;

#undef main

#include <SDL.h>
#include <SDL_events.h>
#include <SDL_image.h>
//#include <stdint.h>
#include "sc_sdl_player.h"


#include "sc_exception.h"
#include "contrlbar.h"

#include "ffplay_define.h"

#define PRId64 "I64"
#define SC_SDL_PLAYER_EX     -6
#define INT64_MIN (-9223372036854775807LL-1)
#define INT64_MAX (9223372036854775807LL)
#define SDL_ALLEVENTS           0xFFFFFFFF
#define SDL_ACTIVEEVENT         0x1

#define ERR_SC_SDL_PLAYER   -9

AVDictionary *swr_opts;
//AVDictionary *sc_format_opts, *codec_opts, *resample_opts;

/* current context */
//static int is_full_screen;


AVDictionary *filter_codec_opts(AVDictionary *opts, enum AVCodecID codec_id,
                                AVFormatContext *s, AVStream *st, AVCodec *codec);
int check_stream_specifier(AVFormatContext *s, AVStream *st, const char *spec);
void sc_sdl_player::InitOnce( )
{
    static bool b = false;
    if( !b )
    {
        b = !b;
//        int rc = SDL_Init(SDL_INIT_AUDIO|SDL_INIT_VIDEO|SDL_INIT_NOPARACHUTE);
        int rc = SDL_Init(SDL_INIT_VIDEO);
        if( rc < 0 )
            sc_log( rc );
    }
}


int sc_sdl_player::play()
{
    return 0;
}

sc_sdl_player::sc_sdl_player(QWidget *parent)
    :  sc_player(parent)
    ,  pSdlWnd( 0 )
    ,  window_title( "")
    ,  screen_width ( 0)
    ,  screen_height( 0)
    ,  cursor_last_shown( 0)
    ,  cursor_hidden( 0)

{   
    dummy_videodriver = "SDL_VIDEODRIVER=dummy";

    //st_name = "http://www.youtube.com/watch?v=H-PWeICLvDw";
    channel = "C:\\Users\\scui\\Desktop\\video\\Clip_480p_5sec_6mbps_new.mpg";

    sc_sdl_player::InitOnce( );
    //XX QT part
    setAttribute(Qt::WA_PaintOnScreen);
    setAttribute(Qt::WA_PaintOnScreen);

    //XXX SDL part
    // attach this widget window with SDL_Window
    pSdlWnd = SDL_CreateWindowFrom( reinterpret_cast< void* >( winId()));

    sc_log( pSdlWnd );

    render = SDL_CreateRenderer( pSdlWnd, -1, SDL_RENDERER_TARGETTEXTURE );

    if ( !SDL_WasInit(SDL_INIT_VIDEO)) {
        throw( sc_exception( SDL_INIT_VIDEO ));
    }


    SDL_EventState(SDL_ACTIVEEVENT, SDL_IGNORE);
    SDL_EventState(SDL_SYSWMEVENT, SDL_IGNORE);
    SDL_EventState(SDL_USEREVENT, SDL_IGNORE);

     x_decoder = new sc_decoder( this );

   //XXX AV part

}
sc_sdl_player::~sc_sdl_player()
{
}

void sc_sdl_player::start()
{
    wanted_stream   [AVMEDIA_TYPE_AUDIO]    = -1;
    wanted_stream   [AVMEDIA_TYPE_VIDEO]    = -1;
    wanted_stream   [AVMEDIA_TYPE_SUBTITLE] = -1;

    if( x_decoder->sc_open( channel ) < 0 )
    {
        sc_log( ERR_SC_SDL_PLAYER );
        return;
    }

    is->width = rect().width();
    is->height = rect().height();

    is->video_stream = x_decoder->video_stream_index;
    is->video_st = x_decoder->pFormatCtx->streams[is->video_stream];
    is->ytop    = 0;
    is->xleft   = 0;

 //   video_codec_name = string( x_decoder->pCodec->name );


 //   packet_queue_init(&is->videoq);

 //   x_decoder->stream_open();

    is->event_loop_tid = SDL_CreateThread( sc_sdl_player::event_loop, "event_loop", this );

}
/* draw only the border of a rectangle */
void sc_sdl_player::fill_border(int xleft, int ytop, int width, int height,
                                int x, int y, int w, int h, int color, int update)
{
    int w1, w2, h1, h2;

    /* fill the background */
    w1 = x;
    if (w1 < 0)
        w1 = 0;
    w2 = width - (x + w);
    if (w2 < 0)
        w2 = 0;
    h1 = y;
    if (h1 < 0)
        h1 = 0;
    h2 = height - (y + h);
    if (h2 < 0)
        h2 = 0;
    fill_rectangle(screen,
                   xleft, ytop,
                   w1, height,
                   color, update);
    fill_rectangle(screen,
                   xleft + width - w2, ytop,
                   w2, height,
                   color, update);
    fill_rectangle(screen,
                   xleft + w1, ytop,
                   width - w1 - w2, h1,
                   color, update);
    fill_rectangle(screen,
                   xleft + w1, ytop + height - h2,
                   width - w1 - w2, h2,
                   color, update);
}

#define ALPHA_BLEND(a, oldp, newp, s)\
((((oldp << s) * (255 - (a))) + (newp * (a))) / (255 << s))

#define RGBA_IN(r, g, b, a, s)\
{\
    unsigned int v = ((const uint32_t *)(s))[0];\
    a = (v >> 24) & 0xff;\
    r = (v >> 16) & 0xff;\
    g = (v >> 8) & 0xff;\
    b = v & 0xff;\
}

#define YUVA_IN(y, u, v, a, s, pal)\
{\
    unsigned int val = ((const uint32_t *)(pal))[*(const uint8_t*)(s)];\
    a = (val >> 24) & 0xff;\
    y = (val >> 16) & 0xff;\
    u = (val >> 8) & 0xff;\
    v = val & 0xff;\
}

#define YUVA_OUT(d, y, u, v, a)\
{\
    ((uint32_t *)(d))[0] = (a << 24) | (y << 16) | (u << 8) | v;\
}


#define BPP 1


static SDL_Surface *image = NULL;


void sc_sdl_player::do_exit()
{
    if (is) {
        x_decoder->stream_close();
    }
    av_lockmgr_register(NULL);
   // uninit_opts();
    avformat_network_deinit();
    if (show_status)
        printf("\n");
    SDL_Quit();
    av_log(NULL, AV_LOG_QUIET, "%s", "");
    exit(0);
}



/* allocate a picture (needs to do that in main thread to avoid
   potential locking problems */
void sc_sdl_player::alloc_picture( sc_sdl_player * plr )
{
    VideoState *is = plr->is;

    VideoPicture *vp;
    vp = &is->pictq[is->pictq_windex];

    if (vp->pFrameRGB) {
        // we already have one make another,bigger/smaller
        if (vp->pFrameRGB) {
            av_free(vp->pFrameRGB);
            vp->pFrameRGB = 0;
        }
        if (vp->buffer) {
            av_free(vp->buffer);
            vp->buffer = 0;
        }
    }

    vp->pFrameRGB = avcodec_alloc_frame();
    vp->width =is->video_st->codec->width;
    vp->height = is->video_st->codec->height;

    vp->numBytes =avpicture_get_size((AVPixelFormat)PIX_FMT_RGB24, vp->width, vp->height);
    vp->buffer = (uint8_t *)av_malloc(vp->numBytes * sizeof(uint8_t));

    if (!vp->pFrameRGB || !vp->buffer) {
        sc_log( vp->pFrameRGB );
        sc_log( vp->buffer)
        throw sc_exception( ERR_SC_SDL_PLAYER );
    }

//    avpicture_fill((AVPicture*)vp->pFrameRGB, vp->buffer,
//            (AVPixelFormat)PIX_FMT_YUV420P,
//              vp->width, vp->height);
    avpicture_fill((AVPicture*)vp->pFrameRGB, vp->buffer, (AVPixelFormat)PIX_FMT_RGB24,
            vp->width, vp->height);

    vp->pFrameRGB->width = vp->width;
    vp->pFrameRGB->height = vp->height;
    vp->pix_fmt = PIX_FMT_RGB24;

    SDL_LockMutex(is->pictq_mutex);
    vp->allocated = 1;
    sc_log( vp->allocated );
    SDL_CondSignal(is->pictq_cond);
    SDL_UnlockMutex(is->pictq_mutex);
}


void sc_sdl_player::stream_cycle_channel( int codec_type)
{
    AVFormatContext *ic = is->ic;
    int start_index, stream_index;
    int old_index;
    AVStream *st;
    AVProgram *p = NULL;
    int nb_streams = is->ic->nb_streams;

    if (codec_type == AVMEDIA_TYPE_VIDEO) {
        start_index = is->last_video_stream;
        old_index = is->video_stream;
    }

    stream_index = start_index;

    if (codec_type != AVMEDIA_TYPE_VIDEO && is->video_stream != -1) {
        p = av_find_program_from_stream(ic, NULL, is->video_stream);
        if (p) {
            nb_streams = p->nb_stream_indexes;
            for (start_index = 0; start_index < nb_streams; start_index++)
                if (p->stream_index[start_index] == stream_index)
                    break;
            if (start_index == nb_streams)
                start_index = -1;
            stream_index = start_index;
        }
    }


 the_end:
    if (p && stream_index != -1)
        stream_index = p->stream_index[stream_index];
}


void sc_sdl_player::refresh_loop_wait_event(sc_sdl_player *plr, SDL_Event* event )
{
    double remaining_time = 0.0;
       SDL_PumpEvents();
       while (!SDL_PeepEvents(event, 1, SDL_GETEVENT, SDL_FIRSTEVENT, SDL_LASTEVENT)) {

           if (remaining_time > 0.0)
               av_usleep((int64_t)(remaining_time * 1000000.0));
           remaining_time = REFRESH_RATE;
           if (plr->is->show_mode != VideoState::SHOW_MODE_NONE &&
                   (!plr->is->paused || plr->is->force_refresh))
               video_refresh(plr, &remaining_time);

           SDL_PumpEvents();

       }
}



AVDictionary *filter_codec_opts(AVDictionary *opts, enum AVCodecID codec_id,
                                AVFormatContext *s, AVStream *st, AVCodec *codec)
{
    AVDictionary    *ret = NULL;
    AVDictionaryEntry *t = NULL;
    int            flags = s->oformat ? AV_OPT_FLAG_ENCODING_PARAM
                                      : AV_OPT_FLAG_DECODING_PARAM;
    char          prefix = 0;
    const AVClass    *cc = avcodec_get_class();

    if (!codec)
        codec            = s->oformat ? avcodec_find_encoder(codec_id)
                                      : avcodec_find_decoder(codec_id);

    switch (st->codec->codec_type) {
    case AVMEDIA_TYPE_VIDEO:
        prefix  = 'v';
        flags  |= AV_OPT_FLAG_VIDEO_PARAM;
        break;    
    }

    while (t = av_dict_get(opts, "", t, AV_DICT_IGNORE_SUFFIX)) {
        char *p = strchr(t->key, ':');

        /* check stream specification in opt name */
        if (p)
            switch (check_stream_specifier(s, st, p + 1)) {
            case  1: *p = 0; break;
            case  0:         continue;
            default:         return NULL;
            }

        if (av_opt_find(&cc, t->key, NULL, flags, AV_OPT_SEARCH_FAKE_OBJ) ||
            (codec && codec->priv_class &&
             av_opt_find(&codec->priv_class, t->key, NULL, flags,
                         AV_OPT_SEARCH_FAKE_OBJ)))
            av_dict_set(&ret, t->key, t->value, 0);
        else if (t->key[0] == prefix &&
                 av_opt_find(&cc, t->key + 1, NULL, flags,
                             AV_OPT_SEARCH_FAKE_OBJ))
            av_dict_set(&ret, t->key + 1, t->value, 0);

        if (p)
            *p = ':';
    }
    return ret;
}



int check_stream_specifier(AVFormatContext *s, AVStream *st, const char *spec)
{
    int ret = avformat_match_stream_specifier(s, st, spec);
    if (ret < 0)
        av_log(s, AV_LOG_ERROR, "Invalid stream specifier: %s.\n", spec);
    return ret;
}

void sc_sdl_player::change_channel( string new_url )
{
    x_decoder->st_name = new_url;

    //XXX    should restart with new stream

}


/* handle an event sent by the GUI */
int sc_sdl_player::event_loop( void * arg )
{
    SDL_Event event;
    double incr, pos, frac;

    sc_sdl_player * plr = (sc_sdl_player *) arg;

    for (;;) {
        double x;
        plr->refresh_loop_wait_event( plr, &event);

         switch (event.type) {
        #define SDL_VIDEORESIZE 0x0011
        case SDL_VIDEORESIZE:
             //change windows size, do something for renderer
            /*
                screen = SDL_SetVideoMode(FFMIN(16383, event.resize.w), event.resize.h, 0,
                                          SDL_HWSURFACE|SDL_RESIZABLE|SDL_ASYNCBLIT|SDL_HWACCEL);
                if (!screen) {
                    av_log(NULL, AV_LOG_FATAL, "Failed to set video mode\n");
                    do_exit(cur_stream);
                }
                screen_width  = cur_stream->width  = screen->w;
                screen_height = cur_stream->height = screen->h;
                cur_stream->force_refresh = 1;*/
            break;

         case SDL_QUIT:
         case FF_QUIT_EVENT:
             plr->do_exit();
             break;
        case FF_ALLOC_EVENT:
            plr->alloc_picture( (sc_sdl_player*)event.user.data1 );
            break;
        default:
            break;
        }
    }
}



void sc_sdl_player::stream_component_close( int stream_index)
{
    VideoState *is = this->is;
    AVFormatContext *ic = is->ic;
    AVCodecContext *avctx;

    if (stream_index < 0 || stream_index >= ic->nb_streams)
        return;
    avctx = ic->streams[stream_index]->codec;

    switch (avctx->codec_type) {
    case AVMEDIA_TYPE_AUDIO:
        break;
    case AVMEDIA_TYPE_VIDEO:
        x_decoder->packet_queue_abort(&is->videoq);

        /* note: we also signal this mutex to make sure we deblock the
           video thread in all cases */
        SDL_LockMutex(is->pictq_mutex);
        SDL_CondSignal(is->pictq_cond);
        SDL_UnlockMutex(is->pictq_mutex);

        SDL_WaitThread(is->video_tid, NULL);

        x_decoder->packet_queue_flush(&is->videoq);
        break;
    case AVMEDIA_TYPE_SUBTITLE:
        break;
    default:
        break;
    }

    ic->streams[stream_index]->discard = AVDISCARD_ALL;
    avcodec_close(avctx);
    switch (avctx->codec_type) {
        break;
    case AVMEDIA_TYPE_VIDEO:
        is->video_st = NULL;
        is->video_stream = -1;
        break;
    case AVMEDIA_TYPE_SUBTITLE:
        break;
    default:
        break;
    }
}


//====================

void av_frame_unref(AVFrame *frame)
{
    int i;

    for (i = 0; i < frame->nb_side_data; i++) {
        av_freep(&frame->side_data[i]->data);
        av_dict_free(&frame->side_data[i]->metadata);
        av_freep(&frame->side_data[i]);
    }
    av_freep(&frame->side_data);

    for (i = 0; i < FF_ARRAY_ELEMS(frame->buf); i++)
        av_buffer_unref(&frame->buf[i]);
    for (i = 0; i < frame->nb_extended_buf; i++)
        av_buffer_unref(&frame->extended_buf[i]);
    av_freep(&frame->extended_buf);
    av_dict_free(&frame->metadata);
    av_buffer_unref(&frame->qp_table_buf);

    avcodec_get_frame_defaults(frame);
}


void sc_sdl_player::video_image_display()
{
    VideoPicture *vp;
    int g_current_duration;  ///maybe used object scope
    SDL_Texture * texture = 0;
    int x, y, width, height;
    SDL_Rect rect;


    vp = &is->pictq[is->pictq_rindex];
    if (vp->pFrameRGB) {

        if (image == NULL) {

           int bpp=24;
           image = SDL_CreateRGBSurfaceFrom(vp->pFrameRGB->data[0],
                               vp->pFrameRGB->width, vp->pFrameRGB->height, bpp,
                               vp->pFrameRGB->linesize[0],
                               0, 0, 0, 0);
           texture = SDL_CreateTextureFromSurface( render, image);

       }
        else
        {
             if (SDL_MUSTLOCK(image))
             {
                 SDL_LockSurface(image);
                 SDL_UpdateTexture(texture, NULL, image->pixels, image->pitch);
                 SDL_UnlockSurface(image);
             }
             else
             {
                 SDL_UpdateTexture(texture, NULL, image->pixels, image->pitch);
             }
       }

        texture =SDL_CreateTexture(render, SDL_PIXELFORMAT_RGB24,
                SDL_TEXTUREACCESS_STREAMING,is->video_st->codec->width,
                is->video_st->codec->height);


   //     SDL_Surface *surface;

   //      surface = IMG_Load( "C:\\Users\\scui\\Desktop\\video\\undocked_gray_thunderstorm.png");
   //     texture = SDL_CreateTextureFromSurface(render, surface);

    //    SDL_RenderClear(render);
  //      SDL_UpdateTexture(texture, NULL,vp->pFrameRGB->data[0], vp->pFrameRGB->linesize[0]);
   //     SDL_UpdateTexture(texture, NULL,vp->buffer, vp->numBytes );

         SDL_RenderCopy(render, texture, NULL, 0 /*&rect*/);

        g_current_duration = (int)get_master_clock() * 1000;
        SDL_RenderPresent(render);

    }
}


