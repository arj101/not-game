function loadObj(url, fillColor = [1, 1, 1]) {
  return new Promise((resolve, _) => {
    return fetch(url)
      .then((response) => response.text())
      .then((text) => resolve(parseObj(text, fillColor)));
  });
}

function parseObj(source, fillColor = [1, 1, 1]) {
  let vertices = [];
  let normals = [];
  let dataBuffer = [];

  let vertexCount = 0;

  const lines = source.split("\n");
  for (const line of lines) {
    const tokens = line.split(" ");
    switch (tokens[0]) {
      case "v":
        vertices.push([
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3]),
        ]);
        break;
      case "vn":
        normals.push([
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3]),
        ]);
        break;
      case "f":
        for (let i = 1; i < tokens.length; i++) {
          vertexCount += 1;
          const [v, n] = tokens[i].split("//").map((x) => parseInt(x));
          const vertPos = vertices[v - 1];
          const normal = normals[n - 1];
          const color = fillColor;
          dataBuffer.push(...vertPos, ...color, ...normal);
        }
        break;
    }
  }

  return { vertexCount, dataBuffer };
}
