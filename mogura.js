let can = document.getElementById("can");
let con = can.getContext("2d");

//画面サイズ
const SCREEN_W = window.innerWidth;
const SCREEN_H = window.innerHeight;

//背景黒設定
can.width = SCREEN_W;
can.height = SCREEN_H;
can.style = "background-color:#000000"
//キャンバスの画質向上
con.imageSmoothingEnabled = true;
con.imageSmoothingQuality = 'high';

//フィールドサイズ
const FIELD_SIZE = 6;

//短い辺の長さ
let SHORT_SIDE;

//バックグラウンドミュージック
let backMusic = new Audio("Escort.mp3");

//音源の定義
let hitSound = []
for (let i=0;i<100;i++){
    hitSound.push(new Audio("hit.mp3"));
}
let smashSound = []
for (let i = 0; i < 30; i++) {
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

//モグラの待機時間
const MoleWait = 1000;
const MolePhase = MoleWait/interval;
const MoleBase = 1;

//当たった回数
let score = 0;

//叩いた回数
let attempt = 0;


//グリッドの様子
let grid = new Array(FIELD_SIZE);
for (let i=0;i<FIELD_SIZE;i++){
    grid[i] = new Array(FIELD_SIZE).fill(0);
}


//ブロックサイズ，マージンサイズ
const BLOCK_SIZE = SHORT_SIDE/(FIELD_SIZE+2);
const MARGIN_SIZE = BLOCK_SIZE;

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
    drawField();
    drawList();
    drawImages();
}

//モグラ1の定義
let mole1 = new Image();
mole1.src="mole1.png";

// 画像を描画する関数
function drawImg(img,x,y) {
    // 画像がロードされているか確認
    if (img.complete) {
        // 画像をCanvasに描画
        con.drawImage(img,BLOCK_SIZE*(x+1),BLOCK_SIZE*(y+1), BLOCK_SIZE, BLOCK_SIZE);
    } else {
        // 画像がロードされていない場合、ロードイベントで描画を呼び出す
        mole1.onload = function () {
            drawImg(mole1,x,y);
        };
    }
}

mole1.onload = function () {
    drawImg(mole1,1,0);
};

//mole1を描くべきリスト
let mole1ListX = []
let mole1ListY = []

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
}

function drawImages(){
    con.clearRect(MARGIN_SIZE, MARGIN_SIZE, BLOCK_SIZE * FIELD_SIZE, BLOCK_SIZE * FIELD_SIZE)
    for (let i = 0; i < mole1ListX.length; i++) {
        drawImg(mole1, mole1ListX[i], mole1ListY[i]);
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

can.addEventListener("click",handleClickOrTouch);
can.addEventListener("touchstart",handleClickOrTouch);

function handleClickOrTouch(e){
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
        grid[x][y] == 0;
        score++;
        drawAll();
        hitSound[score%30].play();
        console.log("yes");
    }else{
        attempt++;
        //smashSound[attempt%100].play();
    }
}


//グリッドのモグラの状態を変化させる
function nextGrid(){
    for (let i=0;i<FIELD_SIZE;i++){
        for (let j=0;j<FIELD_SIZE;j++){
            if ((grid[i][j] >= MoleBase) && (grid[i][j] < MoleBase+MolePhase)) {
                grid[i][j]++;
            }
            else if (grid[i][j]==MoleBase+MolePhase){
                grid[i][j]=0;
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
                    grid[i][j]=1;
                }
            }
        }
    }
}

function drawAll(){
    drawList();
    drawImages();
    drawStatus();
}

function game(){
    if (backMusic.paused){
        backMusic.play();
    }
    nextGrid();
    emergeMole();
    drawAll();
}

initialState();
setInterval(game,interval);


