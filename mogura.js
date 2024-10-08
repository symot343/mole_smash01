let can = document.getElementById("can");
let con = can.getContext("2d");

let angry_can = document.getElementById("angry_can");
let angry_con = angry_can.getContext("2d");

const inputText = document.getElementById("input-text");

const soundButton = document.getElementById("soundButton");
let isOn = false;

soundButton.addEventListener('click',function(){
    isOn = !isOn;
    console.log("yes");
    if (isOn){
        soundButton.textContent = 'ON';
        soundButton.classList.remove('off');
        soundButton.classList.add('on');
    }else{
        soundButton.textContent = 'OFF';
        soundButton.classList.remove('on');
        soundButton.classList.add('off');
    }
});

//プレーヤー名前
let NAME = "guest";

//画面サイズ
const SCREEN_W = window.innerWidth;
const SCREEN_H = window.innerHeight;

let ranking = {};

//背景黒設定
can.width = SCREEN_W;
can.height = SCREEN_H;
can.style = "background-color:#000000"
//キャンバスの画質向上
con.imageSmoothingEnabled = true;
con.imageSmoothingQuality = 'high';

//背景黒設定
angry_can.width = SCREEN_W;
angry_can.height = SCREEN_H;
angry_can.style = "background-color:#000000"
//キャンバスの画質向上
angry_con.imageSmoothingEnabled = true;
angry_con.imageSmoothingQuality = 'high';

//フィールドサイズ
const FIELD_SIZE = 6;

//短い辺の長さ
let SHORT_SIDE;

//バックグラウンドミュージック
//let backMusic = new Audio("Escort.mp3");

//音源の定義
let hitSound = []
for (let i=0;i<10;i++){
    hitSound.push(new Audio("hit.mp3"));
}
let metalSound = []
for (let i = 0; i < 10; i++) {
    metalSound.push(new Audio("metal.mp3"));
}
let smashSound = []
for (let i = 0; i < 10; i++) {
    smashSound.push("");
    smashSound.push(new Audio("smash.mp3"));
}


//画面のうち短い方の幅
if (SCREEN_W < SCREEN_H) {
    SHORT_SIDE = SCREEN_W;
} else {
    SHORT_SIDE = SCREEN_H;
}

//関数の実行頻度(ミリ秒)
const interval = 100;

//モグラの出現頻度(1秒間に出現するモグラの量)
let Mole = 8;
let GMole = 0.7;

//モグラの待機時間
const MoleWait = 1000;
const MolePhase = MoleWait/interval;
const MoleBase = 1;
let MoleCount = 0;

const GoldMoleWait = 2000;
const GoldMolePhase = GoldMoleWait/interval;
const GoldMoleBase = 51;
let GoldMoleCount = 0;

//当たった回数
let score = 0;

//叩いた回数
let attempt = 0;

//ゲームが始まっているかどうか
let start = 0;

//結果を見る前かどうか
let afterGame = 0;

//touchを受け付けるか
let accept = 1;


//グリッドの様子
let grid = new Array(FIELD_SIZE);
for (let i=0;i<FIELD_SIZE;i++){
    grid[i] = new Array(FIELD_SIZE).fill(0);
}

fetch('https://script.google.com/macros/s/AKfycby0Aiko5ulQ8mHkythngN9uUInlkguDRIz8jL-r4ae6q8grFrvYDhOCZRvS4_daIerB9g/exec')
    .then(response => response.json())
    .then(data => {
        data.sort((a, b) => b.score - a.score);
        console.log(data); // シートのデータがJSON形式で表示されます
        ranking = data;
    })
    .catch(error => console.error('Error fetching data:', error));

//ブロックサイズ，マージンサイズ
const BLOCK_SIZE = SHORT_SIDE/(FIELD_SIZE+2);
const MARGIN_SIZE = BLOCK_SIZE;

//input boxの位置
inputText.style.left = `${(BLOCK_SIZE * (FIELD_SIZE + 2) / 2)-81}px`;
inputText.style.top = `${BLOCK_SIZE * (FIELD_SIZE + 2) / 2}px`;

soundButton.style.left = `${BLOCK_SIZE*6}px`;
soundButton.style.top = `${BLOCK_SIZE*0.6}px`;

//フィールドをかく
function drawField(){
    con.strokeStyle = "white";
    con.lineWidth=2;
    con.strokeRect(MARGIN_SIZE,MARGIN_SIZE,BLOCK_SIZE*FIELD_SIZE,BLOCK_SIZE*FIELD_SIZE);
    con.lineWidth=3;
    con.strokeRect(MARGIN_SIZE*0.85, MARGIN_SIZE*0.85, BLOCK_SIZE * (FIELD_SIZE+0.30), BLOCK_SIZE * (FIELD_SIZE+0.30));
}


function initialState(){
    score = 0;
    MoleCount = 0;
    GoldMoleCount = 0;
    angry_rate = 0;
    gameTime = gameLimit;
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j=0;j<FIELD_SIZE;j++){
            grid[i][j] = 0;
        }
    }
    drawField();
    drawList();
    drawImages();
    accept = 0;
    setTimeout(function () {
        accept = 1;
    }, 1000);
}

//モグラ1の定義
let mole1 = new Image();
mole1.src="mole1.png";

let goldMole = new Image();
goldMole.src = "goldMole.png";

let angryMole = new Image();
angryMole.src = "angryMole.png";

// 画像を描画する関数
function drawImg(img,x,y) {
    // 画像がロードされているか確認
    if (img.complete) {
        // 画像をCanvasに描画
        con.drawImage(img,BLOCK_SIZE*(x+1),BLOCK_SIZE*(y+1), BLOCK_SIZE, BLOCK_SIZE);
    }
}

mole1.onload = function () {
    console.log("mole1 loaded");
};

goldMole.onload = function (){
    console.log("goldMole loaded");
};

angryMole.onload = function (){
    console.log("angryMole loaded");
}

//ゲーム時間は30秒
const gameLimit = 12000;
let gameTime = gameLimit;

//mole1を描くべきリスト
let mole1ListX = []
let mole1ListY = []

let goldMoleListX = []
let goldMoleListY = []

//mole1を書くべきリストを作る
function drawList(){
    mole1ListX = [];
    mole1ListY = [];
    for (let i=0;i<FIELD_SIZE;i++){
        for (let j=0;j<FIELD_SIZE;j++){
            if ((grid[i][j] >= MoleBase) && (grid[i][j] <= MoleBase + MolePhase)) {
                mole1ListX.push(i);
                mole1ListY.push(j);
            }
        }
    }
    goldMoleListX = [];
    goldMoleListY = [];
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            if ((grid[i][j] >= GoldMoleBase) && (grid[i][j] <= GoldMoleBase + GoldMolePhase)) {
                goldMoleListX.push(i);
                goldMoleListY.push(j);
            }
        }
    }
}

function drawImages(){
    con.clearRect(MARGIN_SIZE, MARGIN_SIZE, BLOCK_SIZE * FIELD_SIZE, BLOCK_SIZE * FIELD_SIZE)
    for (let i = 0; i < mole1ListX.length; i++) {
        drawImg(mole1, mole1ListX[i], mole1ListY[i]);
    }
    for (let i=0;i<goldMoleListX.length;i++){
        drawImg(goldMole,goldMoleListX[i],goldMoleListY[i]);
    }
}

function drawStatus(){
    con.clearRect(0,0,can.width,MARGIN_SIZE*0.80);
    con.font = "20px Arial";
    con.fillStyle = "white";
    con.textAlign = "center";
    con.textBaseline = "middle";
    con.fillText(`Score:${score}`,can.width/2,MARGIN_SIZE/2);
}

//タイマー用の四角
function drawSquare(y){
    con.fillStyle = "white";
    con.fillRect(MARGIN_SIZE*0.20,MARGIN_SIZE+BLOCK_SIZE*(y+0.1),MARGIN_SIZE*0.50,BLOCK_SIZE*0.50);
    con.fillRect(MARGIN_SIZE*1.30+BLOCK_SIZE*FIELD_SIZE,MARGIN_SIZE+BLOCK_SIZE*(y+0.1),MARGIN_SIZE*0.50,BLOCK_SIZE*0.50);
}

//枠外に時間を表す石を並べる
function drawTimer(){
    con.clearRect(0,0,MARGIN_SIZE*0.80,can.height);
    con.clearRect(MARGIN_SIZE*1.20+BLOCK_SIZE*FIELD_SIZE,0,MARGIN_SIZE*0.80,can.height);
    let rest = gameTime/gameLimit;
    con.fillStyle = "white";
    con.fillRect(MARGIN_SIZE * 0.20, MARGIN_SIZE + (1-rest) * BLOCK_SIZE * FIELD_SIZE, MARGIN_SIZE * 0.50,rest*BLOCK_SIZE*FIELD_SIZE+BLOCK_SIZE*0.20);
    con.fillRect(MARGIN_SIZE * 1.30 + BLOCK_SIZE * FIELD_SIZE, MARGIN_SIZE+(1-rest) * BLOCK_SIZE * FIELD_SIZE, MARGIN_SIZE * 0.50,rest*BLOCK_SIZE*FIELD_SIZE+BLOCK_SIZE*0.20);
}

angry_rate = 0;

function drawAngry(){
    angry_con.clearRect(0, 0, can.width, can.height);
    angry_size = BLOCK_SIZE*(1+angry_rate/10);
    angry_con.drawImage(angryMole,BLOCK_SIZE*4-angry_size/2,BLOCK_SIZE*4-angry_size/2,angry_size,angry_size);
    angry_con.strokeStyle = "white";
    angry_con.lineWidth = 2;
    angry_con.strokeRect(MARGIN_SIZE, MARGIN_SIZE, BLOCK_SIZE * FIELD_SIZE, BLOCK_SIZE * FIELD_SIZE);
    angry_con.lineWidth = 3;
    angry_con.strokeRect(MARGIN_SIZE * 0.85, MARGIN_SIZE * 0.85, BLOCK_SIZE * (FIELD_SIZE + 0.30), BLOCK_SIZE * (FIELD_SIZE + 0.30));
    angry_con.font = `${BLOCK_SIZE*0.5}px Arial`;
    angry_con.fillStyle = "white";
    angry_con.textAlign = "center";
    angry_con.textBaseline = "middle";
    angry_con.fillText(`叩きまくれ！`, BLOCK_SIZE*4, BLOCK_SIZE*0.5);
}

function drawNormal() {
    con.clearRect(0, 0, can.width, can.height);
    angry_size = BLOCK_SIZE * (1 + angry_rate / 10);
    con.drawImage(mole1, BLOCK_SIZE * 4 - angry_size / 2, BLOCK_SIZE * 4 - angry_size / 2, angry_size, angry_size);
    con.strokeStyle = "white";
    con.lineWidth = 2;
    con.strokeRect(MARGIN_SIZE, MARGIN_SIZE, BLOCK_SIZE * FIELD_SIZE, BLOCK_SIZE * FIELD_SIZE);
    con.lineWidth = 3;
    con.strokeRect(MARGIN_SIZE * 0.85, MARGIN_SIZE * 0.85, BLOCK_SIZE * (FIELD_SIZE + 0.30), BLOCK_SIZE * (FIELD_SIZE + 0.30));
}

//結果の表示
function drawResult(){
    accept = 0;
    setTimeout(function(){
        accept=1;
    },3000);
    con.clearRect(0,0,can.width,can.height);
    drawField();
    con.font = `${BLOCK_SIZE*0.6}px Arial`;
    con.fillStyle = "white";
    con.strokeStyle = "white";
    con.textAlign = "center";
    con.textBaseline = "middle";
    con.fillText("Result", (BLOCK_SIZE * (FIELD_SIZE + 2)) / 2, (BLOCK_SIZE*1.5) );
    con.font = `${BLOCK_SIZE*0.4}px Arial`;
    con.textAlign = "left";
    if (NAME==""){
        NAME="guest";
    }
    ranking.sort((a, b) => b.score - a.score);
    let index = ranking.findIndex(rank => rank.score == score);
    con.fillText(`${NAME} killed...`,BLOCK_SIZE*(1.5),BLOCK_SIZE*2.5);
    con.textAlign = "center";
    con.fillText(`${MoleCount}`,BLOCK_SIZE*2,BLOCK_SIZE*3.5);
    con.fillText(`${GoldMoleCount}`, BLOCK_SIZE * 2, BLOCK_SIZE * 4);
    con.fillText(`x1`, BLOCK_SIZE * 3, BLOCK_SIZE * 3.5);
    con.fillText(`x5`, BLOCK_SIZE * 3, BLOCK_SIZE * 4);
    con.fillText(`boss bonus:`, BLOCK_SIZE * 3, BLOCK_SIZE * 5);
    con.font = `${BLOCK_SIZE*0.5}px Arial`;
    con.fillText(`x${(10+angry_rate)/10}`, BLOCK_SIZE * 5, BLOCK_SIZE * 5);
    con.textAlign = "left";
    con.gont = `${BLOCK_SIZE * 0.4}px Arial`;
    con.fillText(`normal mole`,BLOCK_SIZE*4,BLOCK_SIZE*3.5);
    con.fillText(`gold mole`,BLOCK_SIZE*4,BLOCK_SIZE*4);
    con.font = `${BLOCK_SIZE * 0.5}px Arial`;
    con.fillText(`your score is...`, BLOCK_SIZE * (1.5), BLOCK_SIZE * 6);
    con.font = `${BLOCK_SIZE * 0.8}px Arial`;
    con.textAlign = "right";
    con.fillText(`${score}`,BLOCK_SIZE*6.5,BLOCK_SIZE*6);
    con.textAlign = "center";
    con.font = `${BLOCK_SIZE*0.3}px Arial`;
    con.fillText(`${ranking.length}人中${index+1}位`,BLOCK_SIZE*4,BLOCK_SIZE*6.7);
    afterGame = 2;
}

function drawRanking(){
    accept=0;
    setTimeout(function () {
        accept = 1;
    }, 5000);
    con.clearRect(0, 0, can.width, can.height);
    drawField();
    con.font = `${BLOCK_SIZE * 0.6}px Arial`;
    con.fillStyle = "white";
    con.strokeStyle = "white";
    con.textAlign = "center";
    con.textBaseline = "middle";
    con.fillText("Leader Board", (BLOCK_SIZE * (FIELD_SIZE + 2)) / 2, (BLOCK_SIZE * 1.5));
    for (let i=0;i<10;i++){
        con.font = `${BLOCK_SIZE * 0.4}px Arial`;
        con.fillText(`${i+1}`, BLOCK_SIZE * 1.8, BLOCK_SIZE * (2.2 + 0.5 * i));
        con.font = `${BLOCK_SIZE * 0.3}px Arial`;
        con.fillText(`${ranking[i].name}`, BLOCK_SIZE * 3.9, BLOCK_SIZE * (2.2+0.5*i));
        con.font = `${BLOCK_SIZE * 0.4}px Arial`;
        con.fillText(`${ranking[i].score}`, BLOCK_SIZE * 6.0, BLOCK_SIZE * (2.2+0.5*i));
    }
    con.textAlign = "right"
    con.font = `${BLOCK_SIZE * 0.3}px Arial`;
    con.fillText(`みんなのプレイ回数：${ranking.length}`, BLOCK_SIZE * 7.0, BLOCK_SIZE * 0.5);
    afterGame=3;
}

function gameStart(){
    inputText.style.zIndex=1;
    soundButton.style.zIndex=1;
    con.font = "30px Arial";
    con.fillStyle = "white";
    con.strokeStyle = "white";
    con.textAlign = "center";
    con.textBaseline = "middle";
    con.fillText("GAME START", (BLOCK_SIZE * (FIELD_SIZE + 2)) / 2, (BLOCK_SIZE * (FIELD_SIZE + 1)) / 2);
    //con.strokeText("GAME START", (BLOCK_SIZE * (FIELD_SIZE + 2)) / 2, (BLOCK_SIZE * (FIELD_SIZE + 1)) / 2);
    con.font = "15px Arial";
    con.fillStyle = "white";
    con.textAlign = "right";
    con.textBaseline = "middle";
    con.fillText("press anywhere to start...",BLOCK_SIZE*(FIELD_SIZE+1),BLOCK_SIZE*(FIELD_SIZE));
}

//inputboxの入力を受け取る
inputText.addEventListener('input',()=>{
    NAME = inputText.value;
});


can.addEventListener("click",handleClickOrTouch);
can.addEventListener("touchstart",handleClickOrTouch);

function handleClickOrTouch(e){
    if (accept==0){
        return;
    }
    else if (afterGame==1){
        drawResult();
        return;
    }
    else if (afterGame==2){
        drawRanking();
    }
    else if (afterGame == 3) {
        con.clearRect(0, 0, can.width, can.height);
        initialState();
        gameStart();
        afterGame = 0;
        return;
    }
    else if (start==0){
        setOfGame();
        inputText.style.zIndex=-1;
        soundButton.style.zIndex=-1;
        start=1;
    }
    e.preventDefault();
    const rect = can.getBoundingClientRect();
    let clickX,clickY;
    if (e.touches){
        clickX = e.touches[0].clientX - rect.left;
        clickY = e.touches[0].clientY - rect.top;
    }else{
        clickX = e.clientX - rect.left;
        clickY = e.clientY - rect.top;
    }
    let x = Math.floor((clickX - MARGIN_SIZE) / BLOCK_SIZE);
    let y = Math.floor((clickY - MARGIN_SIZE) / BLOCK_SIZE);
    if ((grid[x][y] >= MoleBase) && (grid[x][y] <= MoleBase + MolePhase)) {
        grid[x][y] = 0;
        score++;
        MoleCount++;
        drawAll();
        if (isOn){
            hitSound[score%10].play();
        }
        console.log("hit normal");
    } else if ((grid[x][y] >= GoldMoleBase) && (grid[x][y] <= GoldMoleBase + GoldMolePhase)) {
        grid[x][y] = 0;
        score+=5;
        GoldMoleCount++;
        drawAll();
        if (isOn){
            metalSound[score % 10].play();
        }
        console.log("hit gold");
    } else{
        if (attempt%2===1){
            if (isOn){
                smashSound[attempt%20].play();
            }
        }
        attempt++;
    }
}

angry_can.addEventListener("click", angry_handleClickOrTouch);
angry_can.addEventListener("touchstart", angry_handleClickOrTouch);

function angry_handleClickOrTouch(e){
    angry_rate++;
    drawAngry();
}

function angryGame(){
    angry_can.style.zIndex = '2';
    drawAngry();
    setTimeout(() => {
        con.clearRect(0, 0, can.width, can.height);
        angry_can.style.zIndex='-1';
        drawNormal();
        setTimeout(() => {
            gameOver();
        }, 1000)
    }, 3000);
}

//グリッドのモグラの状態を変化させる
function nextGrid(){
    for (let i=0;i<FIELD_SIZE;i++){
        for (let j=0;j<FIELD_SIZE;j++){
            if (grid[i][j]==0){
                continue;
            }
            else if (grid[i][j] == MoleBase + MolePhase) {
                grid[i][j] = 0;
            }
            else if (grid[i][j] == GoldMoleBase + GoldMolePhase) {
                grid[i][j] = 0;
            }
            else{
                grid[i][j]++;
            }
        }
    }
}

//ランダムにモグラを出現させる
function emergeMole(){
    for (let i = 0; i < FIELD_SIZE; i++) {
        for (let j = 0; j < FIELD_SIZE; j++) {
            if (grid[i][j]==0){
                let num = Math.random();
                if (num<=((Mole*(interval/1000))/(FIELD_SIZE*FIELD_SIZE))){
                    grid[i][j]=MoleBase;
                }
                else if (num<=(((Mole+GMole)*(interval/1000))/(FIELD_SIZE*FIELD_SIZE))){
                    grid[i][j] = GoldMoleBase;
                }
            }
        }
    }
}

function drawAll(){
    drawField();
    drawTimer();
    drawList();
    drawImages();
    drawStatus();
}


function gameOver(){
    start = 0;
    score *= (10+angry_rate)/10;
    score = Math.floor(score);
    console.log(score);
    con.clearRect(0,0,can.width,can.height);
    drawField();
    con.font = "30px Arial";
    con.fillStyle = "white";
    con.strokeStyle = "white";
    con.textAlign = "center";
    con.textBaseline = "middle";
    con.fillText("GAME OVER", (BLOCK_SIZE * (FIELD_SIZE + 2)) / 2, (BLOCK_SIZE * (FIELD_SIZE + 1)) / 2);
    con.font = "15px Arial";
    con.fillStyle = "white";
    con.textAlign = "right";
    con.textBaseline = "middle";
    con.fillText("press anywhere to see the result...", BLOCK_SIZE * (FIELD_SIZE + 1), BLOCK_SIZE * (FIELD_SIZE));
    afterGame = 1;
    //backMusic.pause();
    //backMusic.currentTime = 0;
    accept = 0;
    const name = NAME;
    ranking.push({date:"now",name:NAME,score:score})
    fetch('https://script.google.com/macros/s/AKfycby0Aiko5ulQ8mHkythngN9uUInlkguDRIz8jL-r4ae6q8grFrvYDhOCZRvS4_daIerB9g/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, score })
    })
        .then(response => response.text())
        .then(data => {
            alert('Score submitted successfully!');
        });
    setTimeout(function () {
        accept = 1;
    }, 2000);
}

function game(){
    //if (backMusic.paused){
    //    backMusic.play();
    //}
    gameTime -= interval;
    nextGrid();
    emergeMole();
    drawAll();
}

initialState();
gameStart();

function setOfGame(){
    initialState();
    gameStart();
    let playGame = setInterval(() => {
        game();
    }, interval);
    setTimeout(() => {
        clearInterval(playGame);
        angryGame();
    }, gameLimit);
}




