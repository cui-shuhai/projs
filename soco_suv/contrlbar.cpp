#include <string>

using namespace std;

#include <QStyle>
#include <QSlider>
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QSlider>
#include <QPushButton>

#include <QBoxLayout>
#include <QSlider>
#include <QStyle>
#include <QToolButton>
#include <QComboBox>
#include <QSizePolicy>

#include "sc_sites.h"
#include "contrlbar.h"

ContrlBar::ContrlBar(QWidget *parent)
  : QWidget(parent)
  , playerState(QMediaPlayer::StoppedState)
  , playerMuted(false)
  , videoSlider(0)
  , playButton(0)
  , stopButton(0)
  , volumeSlider(0)
  , rateBox(0)
{
    setSizePolicy(QSizePolicy::MinimumExpanding, QSizePolicy::Minimum);
    videoSlider = new QSlider( Qt::Horizontal);
    videoSlider->setAutoFillBackground(true);
    videoSlider->setRange( 20, 1200);

    playButton = new QToolButton(this);
    playButton->setIcon(style()->standardIcon(QStyle::SP_MediaPlay));

    connect(playButton, SIGNAL(clicked()), this, SLOT(playClicked()));

    pauseButton = new QToolButton(this);
    pauseButton->setIcon(style()->standardIcon(QStyle::SP_MediaPause));
    pauseButton->setEnabled(false);

    stopButton = new QToolButton(this);
    stopButton->setIcon(style()->standardIcon(QStyle::SP_MediaStop));
    stopButton->setEnabled(false);

    connect(stopButton, SIGNAL(clicked()), this, SIGNAL(stop()));

    speaker = new QToolButton(this);
    speaker->setIcon(style()->standardIcon(QStyle::SP_MediaVolumeMuted));
    speaker->setEnabled(false);

   connect(speaker, SIGNAL(clicked()), this, SIGNAL(stop()));

//    muteButton = new QToolButton(this);
//    muteButton->setIcon(style()->standardIcon(QStyle::SP_MediaVolume));

//    connect(muteButton, SIGNAL(clicked()), this, SLOT(muteClicked()));

    volumeSlider = new QSlider(Qt::Horizontal, this);
    volumeSlider->setRange(0, 100);

    connect(volumeSlider, SIGNAL(sliderMoved(int)), this, SIGNAL(changeVolume(int)));

    rateBox = new QComboBox(this);
    rateBox->addItem("0.5x", QVariant(0.5));
    rateBox->addItem("1.0x", QVariant(1.0));
    rateBox->addItem("2.0x", QVariant(2.0));
    rateBox->setCurrentIndex(1);

    videoElapse = new QLabel( );
    videoElapse->setWindowTitle("0/0");

    fullScreenButton = new QPushButton();
    QIcon fsi("C:\\soco_projs\\soco_suv\\fullscreen");
    fullScreenButton->setIcon( fsi );


    connect(rateBox, SIGNAL(activated(int)), SLOT(updateRate()));

    hLayout = new QHBoxLayout;
    vLayout  = new QVBoxLayout;

    hLayout->setMargin(0);
    hLayout->addWidget(pauseButton);
    hLayout->addWidget(playButton);
    hLayout->addWidget(stopButton);
    hLayout->addWidget(speaker);
    hLayout->addWidget(volumeSlider);
    hLayout->addWidget(rateBox);
    hLayout->addWidget( videoElapse );
    hLayout->addWidget(fullScreenButton);



    vLayout->addWidget( videoSlider );
    vLayout->addLayout(hLayout);
    vLayout->setMargin(0);

    setMaximumHeight( 36 );
    setLayout(vLayout);

}

QMediaPlayer::State ContrlBar::state() const
{
    return playerState;
}

void ContrlBar::setState(QMediaPlayer::State state)
{

    if (state != playerState) {
        playerState = state;

        switch (state) {
        case QMediaPlayer::StoppedState:
            stopButton->setEnabled(false);
            playButton->setIcon(style()->standardIcon(QStyle::SP_MediaPlay));
            break;

        case QMediaPlayer::PlayingState:
            stopButton->setEnabled(true);
            playButton->setIcon(style()->standardIcon(QStyle::SP_MediaPause));
            break;
        case QMediaPlayer::PausedState:
            stopButton->setEnabled(true);
            playButton->setIcon(style()->standardIcon(QStyle::SP_MediaPlay));
            break;
        }
    }

}

int ContrlBar::volume() const
{
    return volumeSlider ? volumeSlider->value() : 0;
}

void ContrlBar::setVolume(int v)
{
   if (volumeSlider)
        volumeSlider->setValue(v);
}

bool ContrlBar::isMuted() const
{
    return playerMuted;
}

void ContrlBar::setMuted(bool muted)
{
    if (muted != playerMuted) {
        playerMuted = muted;

 //       muteButton->setIcon(style()->standardIcon(muted
 //               ? QStyle::SP_MediaVolumeMuted
//                : QStyle::SP_MediaVolume));
    }
}

void ContrlBar::playClicked()
{
    switch (playerState) {
    case QMediaPlayer::StoppedState:
    case QMediaPlayer::PausedState:
        emit play();
        break;
    case QMediaPlayer::PlayingState:
        emit pause();
        break;
    }
}

void ContrlBar::muteClicked()
{
    emit changeMuting(!playerMuted);
}

qreal ContrlBar::playbackRate() const
{
    return rateBox->itemData(rateBox->currentIndex()).toDouble();
}

void ContrlBar::setPlaybackRate(float rate)
{
    for (int i = 0; i < rateBox->count(); ++i) {
        if (qFuzzyCompare(rate, float(rateBox->itemData(i).toDouble()))) {
            rateBox->setCurrentIndex(i);
            return;
        }
    }

    rateBox->addItem(QString("%1x").arg(rate), QVariant(rate));
    rateBox->setCurrentIndex(rateBox->count() - 1);
}

void ContrlBar::updateRate()
{
    emit changeRate(playbackRate());
}
