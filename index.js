async function main() {
  /**@type {{canvas: HTMLCanvasElement, gl:WebGLRenderingContext}} */
  const { canvas, gl } = createWebGLCanvas();

  const audio = new AudioEngine();

  document
    .getElementById("play-audio")
    .addEventListener("click", () => audio.init());

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gl.viewport(0, 0, canvas.width, canvas.height);

  let xScale = canvas.height / canvas.width;
  let screenScale = scaleMat4(xScale, 1, 1);

  window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    xScale = canvas.height / canvas.width;
    screenScale = scaleMat4(xScale, 1, 1);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  };

  const program = createSprite2DProgram(gl);
  gl.useProgram(program);

  const PI = Math.PI;
  const sin = Math.sin;
  const cos = Math.cos;

  gl.useProgram(program);
  const u_modelview = gl.getUniformLocation(program, "u_modelview");
  const u_texture = gl.getUniformLocation(program, "texture");

  const texImage = await loadImage("./e.png");
  const texture = new Texture(gl, 0, texImage);

  let player = {
    x: 0.0,
    y: 0.0,
    w: 0.4,
    h: 0.4,
    angle: 0,
  };

  const rect = createRectVertices(
    player.x - player.w / 2,
    player.y - player.h / 2,
    player.w,
    player.h,
  );
  const guy = new Drawable(
    gl,
    program,
    sprite2DAttrs(),
    rect.vertices,
    rect.vertexCount,
  );

  let leftDown = false;
  let rightDown = false;
  let upDown = false;
  let downDown = false;

  const bm = new BulletManager(gl, audio);
  await bm.init();

  window.addEventListener("keydown", (e) => {
    if (!audio.hasInit) audio.init();

    if (e.key == "ArrowRight") {
      rightDown = true;
    }
    if (e.key == "ArrowLeft") {
      leftDown = true;
    }

    if (e.key == "ArrowUp") {
      upDown = true;
    }

    if (e.key == "ArrowDown") {
      downDown = true;
    }

    const delta = { x: 0.2, y: 0.083 };
    if (e.key == " ") {
      audio.playAudio(0.3, {
        x: (player.x * xScale * window.innerWidth) / 2 + window.innerWidth / 2,
        y: (1.0 - (1.0 + player.y) * 0.5) * window.innerHeight,
      });
      setTimeout(() => {
        bm.addBullet(
          player.x + delta.x * cos(player.angle) - delta.y * sin(player.angle),
          player.y -
            0.15 +
            delta.y * cos(player.angle) +
            delta.x * sin(player.angle),
          player.angle,
        );
      }, 100);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key == "ArrowRight") {
      rightDown = false;
    }
    if (e.key == "ArrowLeft") {
      leftDown = false;
    }

    if (e.key == "ArrowUp") {
      upDown = false;
    }

    if (e.key == "ArrowDown") {
      downDown = false;
    }
  });

  function draw(t) {
    requestAnimationFrame(draw);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (rightDown) player.angle -= 0.05;
    if (leftDown) player.angle += 0.05;

    if (upDown) {
      player.x += cos(player.angle) * 0.03;
      player.y += sin(player.angle) * 0.03;
    }
    if (downDown) {
      player.x -= cos(player.angle) * 0.03;
      player.y -= sin(player.angle) * 0.03;
    }

    if (player.y < -1.0) player.y = 1.0;
    if (player.y > 1.0) player.y = -1.0;
    if (player.x > 1.0 / xScale) player.x = -1.0 / xScale;
    if (player.x < -1.0 / xScale) player.x = 1.0 / xScale;

    const dirX = leftDown ? -1 : 0 + rightDown ? 1 : 0;
    const dirY = upDown ? 1 : 0 + downDown ? -1 : 0;

    gl.useProgram(program);
    gl.uniformMatrix4fv(
      u_modelview,
      false,
      transform(
        rotAtMat4(0, -0.15, 0, 0, 0, player.angle),
        translateMat4(player.x, player.y, 0),
        screenScale,
      ),
    );
    texture.bindTexture(u_texture);
    guy.draw(gl.TRIANGLES);

    bm.draw(screenScale);
    bm.update(xScale);
  }

  requestAnimationFrame(draw);
}

window.onload = main;
