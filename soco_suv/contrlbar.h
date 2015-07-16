#ifndef CONTRLBAR_H
#define CONTRLBAR_H

#include <QMediaPlayer>
#include <QWidget>
#include <QSlider>
#include <QPushButton>
#include <QLabel>
#include <QBoxLayout>

class QAbstractButton;
class QAbstractSlider;
class QComboBox;

class ContrlBar : public QWidget
{
    Q_OBJECT

public:
    ContrlBar(QWidget *parent = 0);

    QMediaPlayer::State state() const;
    int volume() const;
    bool isMuted() const;
    qreal playbackRate() const;

public slots:
    void setState(QMediaPlayer::State state);
    void setVolume(int volume);
    void setMuted(bool muted);
    void setPlaybackRate(float rate);

signals:
    void play();
    void pause();
    void stop();
    void changeVolume(int volume);
    void changeMuting(bool muting);
    void changeRate(qreal rate);

private slots:
    void playClicked();
    void muteClicked();
    void updateRate();

public:
    QMediaPlayer::State playerState;
    bool playerMuted;

    QAbstractSlider *videoSlider;

    QAbstractButton *playButton;
    QAbstractButton *pauseButton;
    QAbstractButton *stopButton;
    QAbstractButton *speaker;
    QAbstractSlider *volumeSlider;
    QComboBox *rateBox;  //used only for play back
    QLabel *videoElapse;

    QAbstractButton *fullScreenButton;
    QBoxLayout *hLayout;
    QBoxLayout *vLayout;

};

#endif
