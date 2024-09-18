class AudioEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.hasInit = false;
    this.audioElement = document.getElementById("audio");
    this.compressor = new DynamicsCompressorNode(this.ctx, {
      ratio: 20,
      attack: 1,
      release: 1,
    });

    this.globalGain = this.ctx.createGain();

    this.globalGain.gain.exponentialRampToValueAtTime(
      1,
      this.ctx.currentTime + 0.1
    );

    this.compressor.connect(this.globalGain).connect(this.ctx.destination);
  }

  async init() {
    this.hasInit = true;
    this.ctx.resume();

    const listener = this.ctx.listener;
    const posX = window.innerWidth / 2;
    const posY = window.innerHeight / 2;
    const posZ = 0;
    if (listener.positionX) {
      listener.positionX.value = posX;
      listener.positionY.value = posY;
      listener.positionZ.value = posZ - 5;
    } else {
      listener.setPosition(posX, posY, posZ - 5);
    }

    const bounceAudio = await fetch("./bounce.mp3");
    const bounceAudioBuffer = await bounceAudio.arrayBuffer();
    this.bounceAudioBuffer = await this.ctx.decodeAudioData(bounceAudioBuffer);

    const bgmElement = document.getElementById("bgm");
    bgmElement.loop = true;
    bgmElement.volume = 0.1;
    this.bgmTrack = this.ctx.createMediaElementSource(bgmElement);
    const bgmGain = this.ctx.createGain();
    bgmGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
    this.bgmTrack.connect(bgmGain).connect(this.compressor);
    bgmElement.play();
  }

  playAudio(vol = 1.0, pos = { x: null, y: null }) {
    if (vol <= 0.0) return; //no need to play then lol

    const source = this.ctx.createBufferSource();
    source.buffer = this.bounceAudioBuffer;
    const gain = this.ctx.createGain();

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
      rolloffFactor: 10,
      coneInnerAngle: 60,
      coneOuterAngle: 90,
      coneOuterGain: 0.4,
    });

    // vol *= 10.0;
    // console.log(vol);
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
    source.connect(panner).connect(gain).connect(this.compressor);
    source.start();
  }
}
