class Bullet {
  /**
   *
   * @param {WebGLRenderingContext} gl
   * @param {AudioEngine} audio
   */
  constructor(x, y, dir, audio, speed = 0.03) {
    this.prevX = x;
    this.prevY = y;
    this.x = x;
    this.y = y;
    this.vel = { x: Math.cos(dir) * speed, y: Math.sin(dir) * speed };
    this.age = 0;
    this.audio = audio;
  }
  update(xScale = 1) {
    this.prevX = this.x;
    this.prevY = this.y;

    this.x += this.vel.x;
    this.y += this.vel.y;

    let bounce = false;
    let bounceY = false;
    let bounceX = false;

    if (this.y > 1.0 || this.y < -1.0) {
      this.vel.y = -this.vel.y * 0.9;
      this.vel.x *= 0.98;
      bounce = true;
      bounceY = true;
    }
    if (this.x * xScale > 1.0 || this.x * xScale < -1.0) {
      this.vel.x = -this.vel.x * 0.9;
      this.vel.y *= 0.98;
      bounce = true;
      bounceX = true;
    }

    this.vel.y -= 0.0002;

    if (this.y > 1.0) {
      this.y = 1.0;
    }
    if (this.y < -1.0) {
      this.y = -1.0;
    }
    if (this.x * xScale > 1.0) {
      this.x = 1.0 / xScale;
    }
    if (this.x * xScale < -1.0) {
      this.x = -1.0 / xScale;
    }

    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    if (bounce) {
      const volume = Math.min(
        (bounceY ? Math.abs(dy) : Math.abs(dx)) * 10,
        0.4
      );
      this.audio.playAudio(volume, {
        x: (this.x * window.innerWidth) / 2 + window.innerWidth / 2,
        y: (1.0 - (this.y + 1.0) * 0.5) * window.innerHeight,
      });
    }

    this.age += 1;
  }
}

class BulletManager {
  /**
   *
   * @param {WebGLRenderingContext} gl
   * @param {AudioEngine} audio
   */
  constructor(gl, audio) {
    this.gl = gl;
    this.bullets = [];
    this.bulletVertices = createRectVertices(-0.012, -0.012, 0.024, 0.024);
    this.audio = audio;

    const vshader = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
uniform mat4 u_modelview;
varying vec2 v_texcoord;

void main() {
    vec2 position = a_position;
  gl_Position = u_modelview * vec4(position, 0., 1.);
    gl_PointSize=10.0;
    v_texcoord = a_texcoord;
}
`;

    const fshader = `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D texture;

void main() {
  gl_FragColor = texture2D(texture, v_texcoord);
}
`;
    this.program = createProgramFromSource(gl, vshader, fshader);

    this.drawable = new Drawable(
      gl,
      this.program,
      sprite2DAttrs(),
      this.bulletVertices.vertices,
      this.bulletVertices.vertexCount
    );
    gl.useProgram(this.program);

    this.u_modelview = gl.getUniformLocation(this.program, "u_modelview");
    this.u_texture = gl.getUniformLocation(this.program, "texture");
    this.u_dir = gl.getUniformLocation(this.program, "dir");
    this.u_speed = gl.getUniformLocation(this.program, "speed");
  }

  async init() {
    this.bulletImg = new Image();
    this.bulletImg.src = "./b.png";
    await new Promise((resolve) => {
      this.bulletImg.onload = resolve;
    });
    this.texture = new Texture(this.gl, 0, this.bulletImg);
  }

  addBullet(x, y, dir, speed) {
    const bullet = new Bullet(x, y, dir, this.audio, speed);
    this.bullets.push(bullet);
  }

  update(xScale = 1) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(xScale);
      const dx = bullet.x - bullet.prevX;
      const dy = bullet.y - bullet.prevY;
      if (bullet.age > 200 && Math.sqrt(dx * dx + dy * dy) < 1e-6) {
        this.bullets.splice(i, 1);
      }
    }
  }

  draw(screenScale) {
    this.gl.useProgram(this.program);
    this.texture.bindTexture(this.u_texture);

    this.drawable.bindBuffersAndVAs();

    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      this.gl.uniformMatrix4fv(
        this.u_modelview,
        false,
        transform(
          rotAtMat4(0, 0.0, 0, 0, 0, Math.atan2(bullet.vel.y, bullet.vel.x)),
          translateMat4(bullet.x, bullet.y, 0),
          screenScale || identityMat4()
        )
      );

      this.drawable.justDraw(this.gl.TRIANGLES);
    }
  }
}
