const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// data
const PREPARE_TIME = 5;
const GAP = 70;
const ORG_X = GAP;
const ORG_Y = canvas.height - GAP;
const STAGE_WIDTH = canvas.width - GAP * 2;
const STAGE_HEIGHT = canvas.height - GAP * 2;

const PRIMARY_COLOR = "#6D6D8F";
const BACKGROUND_COLOR = "#2A2A38";

const rocketImageCount = 180;
const crashImageCount = 119;
const rocketImages = [];
const crashImages = [];
let earningImage;

async function loadFonts() {
  const font = new FontFace("PassionOne", "url(fonts/Passion_One/PassionOne-Regular.ttf)", {
    style: "normal",
    weight: "400",
    stretch: "condensed",
  });
  // wait for font to be loaded
  await font.load();
  // add font to document
  document.fonts.add(font);
  // enable font with CSS class
  document.body.classList.add("fonts-loaded");
}

const importImages = async () => {
  for (let i = 1; i <= rocketImageCount; i++) {
    let img = new Image();
    await new Promise(r => img.onload = r, img.src = `./rocket/${("" + i).padStart(4, "0")}.png`);
    rocketImages.push(img);
  }
  for (let i = 1; i <= crashImageCount; i++) {
    let img = new Image();
    await new Promise(r => img.onload = r, img.src = `./crash/${("" + i).padStart(4, "0")}.png`);
    crashImages.push(img);
  }

  earningImage = new Image();
  await new Promise(r => earningImage.onload = r, earningImage.src = `./earning.png`);
};

let timeElapsed = 0;
let crashTimeElapsed = 0;
let popUpElapsed = 0;
let isRising = false;

const f = (x) => {
  x -= PREPARE_TIME;
  if (x < 0) {
    return Math.pow(1 - x * x / PREPARE_TIME / PREPARE_TIME, 0.4);
    return Math.pow(x / PREPARE_TIME + 1, Math.pow(-x / PREPARE_TIME, 2));
  }
  // return Math.pow(x / 10, 1 + x / 100 * 2) + 1;
  return Math.pow(x / 10, 2.5) + 1;
}

const drawText = (content, x, y, fillstyle, fontSize, align = "left") => {
  ctx.font = fontSize + " PassionOne"; // Montserrat
  ctx.textAlign = align;
  ctx.fillStyle = fillstyle;
  ctx.fillText(content, x, y);
  let metrics = ctx.measureText(content);
  return {
    width: metrics.width,
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  }
}

const drawAxis = (W, H) => {
  ctx.save();
  ctx.beginPath();
  let xInterval = 2;
  let yInterval = 0.5;

  if (W > 10) xInterval = 5;
  if (W > 25) xInterval = 10;
  if (W > 50) xInterval = 25;
  if (W > 100) xInterval = 50;
  if (W > 250) xInterval = 100;
  if (W > 500) xInterval = 205;

  if (H < 2.5) yInterval = 1;
  else {
    let base = 1;
    while (base * 10 <= H) base *= 10;
    if (base * 2.5 >= H) yInterval = base / 2;
    else yInterval = base;
  }

  for (let x = 0; x <= W; x += xInterval) {
    let xPos = ORG_X + STAGE_WIDTH / W * x;
    let yPos = ORG_Y;
    var rt = drawText(x, xPos, yPos, PRIMARY_COLOR, "24px", x ? "center" : "left");

    if (x) ctx.lineTo(xPos - rt.width / 2 - 15, yPos - rt.height / 2);
    ctx.strokeStyle = "#37374D";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xPos + rt.width / 2 + 15, yPos - rt.height / 2);
  }

  if (Math.floor(W / xInterval) * xInterval + xInterval / 10 < W) {
    ctx.lineTo(ORG_X + STAGE_WIDTH, ORG_Y - rt.height / 2);
  }

  for (let y = 0; y <= H; y += yInterval) {
    let xPos = ORG_X;
    let yPos = ORG_Y - STAGE_HEIGHT / H * y;
    if (y) drawText(y + "x", xPos, yPos, PRIMARY_COLOR, "24px", "left");

    if (y) ctx.lineTo(xPos, yPos + 15);
    ctx.strokeStyle = "#37374D";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xPos, yPos - 28);
  }
  if (Math.floor(H / yInterval) * yInterval + yInterval / 10 < H) {
    ctx.lineTo(ORG_X, ORG_Y - STAGE_HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
};

const drawRocket = (W, H) => {
  const D = 30;
  const curX = ORG_X + STAGE_WIDTH / W * timeElapsed + D;
  const curY = ORG_Y - f(timeElapsed) / H * STAGE_HEIGHT - D;
  const imgWidth = 150;
  const imgHeight = 150;
  const delta = 0.1;
  let ang = Math.atan2((f(timeElapsed - delta) - f(timeElapsed)) / H, delta / W / (timeElapsed / 5 ? 0.5 : 1));
  ctx.save();
  ctx.translate(curX, curY);
  ctx.rotate(ang);
  ctx.drawImage(rocketImages[parseInt(timeElapsed * 50) % 180], -imgWidth / 4, -imgHeight / 2, imgWidth, imgHeight);
  ctx.restore();
};

const drawGraph = (W, H) => {
  const D = 30;
  const SEG = Math.min(timeElapsed * 100, 1000);

  const pureGraph = () => {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.moveTo(ORG_X + D, ORG_Y - D);
    for (let i = 0; i <= SEG; i++) {
      let x = timeElapsed / SEG * i;
      let curX = ORG_X + STAGE_WIDTH / W * x;
      let curY = ORG_Y - f(x) / H * STAGE_HEIGHT;
      ctx.lineTo(curX + D, curY - D);
    }
  };

  let stx = ORG_X + D;
  let sty = ORG_Y - D;
  let xx = timeElapsed / W * STAGE_WIDTH;
  let yy = f(timeElapsed) / H * STAGE_HEIGHT;
  let edx = stx + xx;
  let edy = sty - yy;

  ctx.save();
  pureGraph();
  let radFillGrad = ctx.createRadialGradient(ORG_X + D, ORG_Y - D, 0, ORG_X + D, ORG_Y - D, Math.hypot(xx, yy));
  radFillGrad.addColorStop(0, "#292938");
  radFillGrad.addColorStop(0.5, "#4A70FF");
  radFillGrad.addColorStop(1, "#AD19C6");
  ctx.lineTo(edx, sty);
  ctx.lineTo(stx, sty);
  ctx.fillStyle = radFillGrad;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#292938";
  ctx.filter = "blur(40px)";
  ctx.fillRect(0, ORG_Y - D - 100, canvas.width, 200);
  ctx.restore();

  ctx.save();
  pureGraph();
  let radGrad = ctx.createRadialGradient(ORG_X, ORG_Y, 0, ORG_X, ORG_Y, Math.hypot(xx, yy));
  radGrad.addColorStop(0, "#61B0D0");
  radGrad.addColorStop(0.5, "#4A70FF");
  radGrad.addColorStop(1, "#AD19C6");
  ctx.lineWidth = 10;
  ctx.strokeStyle = radGrad;
  ctx.shadowColor = "#111111";
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 3;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  let lineInnerGrad = ctx.createLinearGradient(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  lineInnerGrad.addColorStop(0, "#9CD5FF");
  lineInnerGrad.addColorStop(1, "#FFC1DF");
  ctx.lineWidth = 6;
  ctx.strokeStyle = lineInnerGrad;
  ctx.filter = "blur(2px)";
  ctx.stroke();
  ctx.restore();
}

const drawCrash = (W, H) => {
  const D = 30;
  const curX = ORG_X + STAGE_WIDTH / W * timeElapsed + D;
  const curY = ORG_Y - f(timeElapsed) / H * STAGE_HEIGHT - D;
  const imgWidth = 300;
  const imgHeight = 300;
  ctx.save();
  ctx.translate(curX, curY);
  ctx.drawImage(crashImages[crashTimeElapsed], -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
  ctx.restore();
}

const drawBackground = () => {
  ctx.save();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#9595B9";
  ctx.filter = "blur(100px)";
  ctx.beginPath();
  ctx.arc(canvas.width, 50, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawStatusText = () => {
  ctx.save();
  let content = f(timeElapsed).toFixed(2) + "x";
  let fontSize = 120;
  if (timeElapsed < 5) {
    content = 5 - Math.floor(timeElapsed);
    ctx.globalAlpha = 1 - (timeElapsed - Math.floor(timeElapsed));
    fontSize *= (1 + ctx.globalAlpha);
  }
  if (!isRising) content = `Bang @${f(timeElapsed).toFixed(2)}x`;
  drawText(content, canvas.width / 2, canvas.height / 3, isRising ? "#F5F5FA" : "#FF3300", `${fontSize}px`, "center");
  ctx.restore();
}

const drawCashOut = () => {
  popUpElapsed = Math.min(popUpElapsed, 0.5);

  const D = 30;
  const curX = ORG_X + STAGE_WIDTH / 2;
  const curY = ORG_Y - STAGE_HEIGHT / 2;
  const imgWidth = 600 * Math.pow(popUpElapsed * 2, 0.3);
  const imgHeight = 400 * Math.pow(popUpElapsed * 2, 0.3);
  ctx.save();
  ctx.translate(curX, curY);
  ctx.drawImage(earningImage, -imgWidth / 2, -imgHeight / 2 + STAGE_HEIGHT / 15, imgWidth, imgHeight);

  // draw earning text
  const content = "+10.327 EBONE";
  let posX = 0;
  let posY = -STAGE_HEIGHT / 15;
  const fontSize = "48px";;
  ctx.font = fontSize + " PassionOne"; // Montserrat
  ctx.textAlign = "center"

  let metrics = ctx.measureText(content);
  let textWidth = metrics.width;
  let textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  console.log(textWidth, textHeight, posY);
  let linearGrad = ctx.createLinearGradient(0, posY - textHeight, 0, posY);
  linearGrad.addColorStop(0.3, "#FFFFFF");
  linearGrad.addColorStop(0.7, "#FF9900");
  ctx.fillStyle = linearGrad;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#FF9900";
  ctx.fillText(content, posX, posY);

  ctx.restore();
};

const draw = () => {
  let W = Math.max(10, timeElapsed * 1.1);
  let H = Math.max(2, f(timeElapsed) * 1.3);

  drawBackground();
  drawStatusText();
  if (isRising) {
    drawGraph(W, H);
    drawRocket(W, H);
  } else {
    drawCrash(W, H);
  }
  drawCashOut();
  drawAxis(W, H);
}

const startNewRound = () => {
  isRising = true;
  timeElapsed = 0;
  let timerId = setInterval(() => {
    if (isRising && timeElapsed > 5 && Math.random() < 0.01) {
      // isRising = false;
      // crashTimeElapsed = 0;
    }
    draw();
    if (isRising) {
      timeElapsed += 0.05;
    } else {
      crashTimeElapsed += 1;
      // start a new round
      if (crashTimeElapsed >= crashImageCount) {
        clearInterval(timerId);
        startNewRound();
      }
    }
  }, 50);
};

const staticImage = () => {
  isRising = true;

  timeElapsed = 13;
  setInterval(() => {
    popUpElapsed += 0.05;
    draw();
  }, 50);
  // let timerId = setInterval(() => {
  //   if (isRising && timeElapsed > 5 && Math.random() < 0.01) {
  //     // isRising = false;
  //     // crashTimeElapsed = 0;
  //   }
  //   draw();
  //   if (isRising) {
  //     timeElapsed += 0.05;
  //   } else {
  //     crashTimeElapsed += 1;
  //     // start a new round
  //     if (crashTimeElapsed >= crashImageCount) {
  //       clearInterval(timerId);
  //       startNewRound();
  //     }
  //   }
  // }, 50);
};

const run = async () => {
  await importImages();
  await loadFonts();

  startNewRound();
  // staticImage();
};

run();