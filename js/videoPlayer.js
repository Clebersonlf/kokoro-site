class VideoPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.setupControls();
    }

    setupControls() {
        this.video.addEventListener('play', () => {
            console.log('Vídeo iniciado');
        });

        this.video.addEventListener('pause', () => {
            console.log('Vídeo pausado');
        });
    }

    play() {
        this.video.play();
    }

    pause() {
        this.video.pause();
    }
}