class AudioEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.audioElement = document.getElementById("audio");

    this.compressor = new DynamicsCompressorNode(this.ctx, {
      ratio: 20,
      attack: 1,
      release: 1,
    });

    const listener = this.ctx.listener;

    const posX = window.innerWidth / 2;
    const posY = window.innerHeight / 2;
    const posZ = 0;

    listener.positionX.value = posX;
    listener.positionY.value = posY;
    listener.positionZ.value = posZ - 5;
  }

  async init() {
    this.ctx.resume();
    const bounceAudio = await fetch("./bounce.mp3");
    const bounceAudioBuffer = await bounceAudio.arrayBuffer();
    this.bounceAudioBuffer = await this.ctx.decodeAudioData(bounceAudioBuffer);

    const bgmElement = document.getElementById("bgm");
    bgmElement.loop = true;

    this.bgmTrack = this.ctx.createMediaElementSource(bgmElement);
    this.bgmTrack.connect(this.compressor).connect(this.ctx.destination);

    bgmElement.play();
    this.bgmTrack.start();
    // bgmElement.addEventListener("ended", () => {
    //   bgmElement.currentTime = 0;
    //   bgmElement.play();
    //   this.bgmTrack.start();
    // });
  }

  playAudio(vol = 1.0, pos = { x: null, y: null }) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.bounceAudioBuffer;
    const gain = this.ctx.createGain();

    // this.compressor.ratio.setValueAtTime(20, this.ctx.currentTime);
    // this.compressor.attack.setValueAtTime(1, this.ctx.currentTime);
    // this.compressor.release.setValueAtTime(1, this.ctx.currentTime);

    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.5);

    const panner = new PannerNode(this.ctx, {
      panningModel: "HRTF",
      distanceModel: "linear",
      positionX: pos.x ?? window.innerWidth / 2,
      positionY: pos.y ?? window.innerHeight / 2,
      positionZ: 0,
      orientationX: 0,
      orientationY: 0,
      orientationZ: -1,
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 50,
      coneInnerAngle: 60,
      coneOuterAngle: 90,
      coneOuterGain: 0.4,
    });

    source
      .connect(panner)
      .connect(gain)
      .connect(this.compressor)
      .connect(this.ctx.destination);
    source.start();
  }
}
