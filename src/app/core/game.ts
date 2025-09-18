import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SHAPES } from './shapes';

// 定数
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
const INITIAL_FALL_SPEED = 1000;
const MIN_FALL_SPEED = 100;
const SPEED_INCREMENT = 50;
const HOLD_DELAY = 500;
const REPEAT_INTERVAL = 150;
// ★ ゴーストピース用の定数を追加
const GHOST_PIECE_STATE = 9;

// Pieceインターフェース
interface Piece {
  x: number;
  y: number;
  shape: number[][];
  typeId: number;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private board: number[][] = [];
  private piece!: Piece;
  private pieceQueue: number[] = [];
  private holdPieceId: number = 0;
  private canHold: boolean = true;

  public board$ = new BehaviorSubject<number[][]>([]);
  public score$ = new BehaviorSubject<number>(0);
  public isGameOver$ = new BehaviorSubject<boolean>(false);
  public nextPieces$ = new BehaviorSubject<number[]>([]);
  public holdPiece$ = new BehaviorSubject<number>(0);
  public level$ = new BehaviorSubject<number>(0);
  // ★★★ プレイ時間を管理するプロパティを追加 ★★★
  public elapsedTime$ = new BehaviorSubject<number>(0);
  private fallSpeed: number = INITIAL_FALL_SPEED;

  private gameInterval: any;
  private continuousMoveInterval: any;
  // ★★★ 時間計測用のタイマーIDを追加 ★★★
  private timeInterval: any;
  // ★ 長押し判定用のタイマーIDをサービスに移動
  private holdTimeout: any;

  // ★ 効果音再生用のAudioオブジェクトを追加
  private clearSound = new Audio('assets/coin05.mp3');
  // ★ ゴーストピースの情報を保持するプロパティを追加
  private ghostPiece!: Piece;

  // ★★★ ここからが変更点 ★★★

  // BGM用のAudioオブジェクトをプロパティとして追加
  private bgm = new Audio('assets/tetris-theme-korobeiniki-arranged-for-piano.mp3');
  private isMuted = false; // ミュート状態を管理するフラグ（将来的なミュート機能用）

  // ★★★ ここまで ★★★

  constructor() {
    // ★ SEの音量を50%に設定
    this.clearSound.volume = 0.1;

    // BGMが終了したら、再度再生を開始するように設定（ループ再生）
    this.bgm.addEventListener('ended', () => {
      this.bgm.currentTime = 0;
      this.bgm.play();
    });
  }

  start() {
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.stopContinuousMove();

    // ★ ゲーム開始時にBGMを再生
    this.playBgm();

    this.board = this.createEmptyBoard();
    this.score$.next(0);
    this.isGameOver$.next(false);
    this.pieceQueue = [];
    this.holdPieceId = 0;
    this.holdPiece$.next(0);
    this.canHold = true;
    this.level$.next(0);
    this.elapsedTime$.next(0); // ★ 時間をリセット
    this.fallSpeed = INITIAL_FALL_SPEED;
    this.ensureQueueIsFull();
    this.spawnPiece();
    this.updateBoard();
    this.resetGameInterval();
    this.startTimeTracking(); // ★ 時間計測を開始
  }

  /**
    * ★★★ 新しいメソッド：時間計測とレベルアップ判定を開始 ★★★
    */
  private startTimeTracking() {
    let elapsedSeconds = 0;
    this.timeInterval = setInterval(() => {
      if (!this.isGameOver$.getValue()) {
        elapsedSeconds++;
        this.elapsedTime$.next(elapsedSeconds); // UIに時間を通知
        this.updateLevelByTime(elapsedSeconds); // 時間経過でレベルアップを判定
      }
    }, 1000);
  }

  /**
   * ★★★ 修正されたメソッド (旧updateLevelAndSpeed) ★★★
   * 経過時間に基づいてレベルと落下速度を計算する
   * @param seconds 現在の経過秒数
   */
  private updateLevelByTime(seconds: number) {
    // ★★★ 10秒ごとに1レベルアップするように変更 ★★★
    const newLevel = Math.floor(seconds / 10);

    if (newLevel > this.level$.getValue()) {
      this.level$.next(newLevel);
      console.log(`Level Up! Level: ${newLevel}`);

      const newSpeed = Math.max(MIN_FALL_SPEED, INITIAL_FALL_SPEED - (newLevel * SPEED_INCREMENT));

      if (newSpeed !== this.fallSpeed) {
        this.fallSpeed = newSpeed;
        this.resetGameInterval();
      }
    }
  }

  // ... (その他のメソッドは変更なしです)
  hold() {
    if (this.isGameOver$.getValue() || !this.canHold) { return; } if (this.holdPieceId === 0) { this.holdPieceId = this.piece.typeId; this.spawnPiece(); } else { const previouslyHeldId = this.holdPieceId; this.holdPieceId = this.piece.typeId; this.spawnPiece(previouslyHeldId); } this.canHold = false; this.holdPiece$.next(this.holdPieceId);
    // ★ ゴーストピースの位置を計算
    this.updateGhostPiece();
    this.updateBoard();
  }
  private gameLoop() { if (this.isGameOver$.getValue()) { clearInterval(this.gameInterval); return; } this.softDrop(); }
  moveLeft(): void {
    if (this.isGameOver$.getValue()) return; const nextX = this.piece.x - 1; if (this.isValidPosition(nextX, this.piece.y, this.piece.shape)) {
      this.piece.x = nextX;
      // ★ ゴーストピースの位置を計算
      this.updateGhostPiece();
      this.updateBoard();
    }
  }
  moveRight(): void {
    if (this.isGameOver$.getValue()) return; const nextX = this.piece.x + 1; if (this.isValidPosition(nextX, this.piece.y, this.piece.shape)) {
      this.piece.x = nextX;
      // ★ ゴーストピースの位置を計算
      this.updateGhostPiece();
      this.updateBoard();
    }
  }
  rotate(): void {
    if (this.isGameOver$.getValue()) return; const rotatedShape = this.rotateMatrix(this.piece.shape); if (this.isValidPosition(this.piece.x, this.piece.y, rotatedShape)) {
      this.piece.shape = rotatedShape;
      // ★ ゴーストピースの位置を計算
      this.updateGhostPiece();
      this.updateBoard();
    }
  }
  rotateCounterClockwise(): void {
    if (this.isGameOver$.getValue()) return; const rotatedShape = this.rotateMatrixCounterClockwise(this.piece.shape); if (this.isValidPosition(this.piece.x, this.piece.y, rotatedShape)) {
      this.piece.shape = rotatedShape;
      // ★ ゴーストピースの位置を計算
      this.updateGhostPiece();
      this.updateBoard();
    }
  }
  softDrop(): void {
    if (this.isGameOver$.getValue()) return;
    const nextY = this.piece.y + 1;
    if (this.isValidPosition(this.piece.x, nextY, this.piece.shape)) {
      this.piece.y = nextY;
    } else {
      this.lockPiece();
    }
    // lockPieceの中でupdateBoardが呼ばれるのでここでは不要
    this.updateBoard();
  }

  hardDrop(): void {
    if (this.isGameOver$.getValue()) return;
    while (this.isValidPosition(this.piece.x, this.piece.y + 1, this.piece.shape)) {
      this.piece.y++;
    }
    this.lockPiece();
    this.updateBoard();

  }/**
    * ★★★ 修正されたメソッド ★★★
    * 連続移動の開始（最初の即時実行を削除）
    */
  startContinuousMove(direction: 'left' | 'right' | 'down'): void {
    if (this.isGameOver$.getValue()) return;

    // 既存のタイマーをクリア
    this.stopContinuousMove();

    // 100ミリ秒ごとに操作を繰り返すタイマーを設定
    this.continuousMoveInterval = setInterval(() => {
      switch (direction) {
        case 'left': this.moveLeft(); break;
        case 'right': this.moveRight(); break;
        case 'down': this.softDrop(); break;
      }
    }, 100);
  }
  stopContinuousMove(): void { clearInterval(this.continuousMoveInterval); }

  // ★★★ 新しいメソッド：ボタンが押された時の処理 ★★★
  startMove(direction: 'left' | 'right' | 'down'): void {
    if (this.isGameOver$.getValue()) return;

    // 既存のタイマーをすべてクリア
    this.stopMove();

    // 1. まず1回だけ即座に実行する（タップのレスポンス）
    switch (direction) {
      case 'left': this.moveLeft(); break;
      case 'right': this.moveRight(); break;
      case 'down': this.softDrop(); break;
    }

    // 2. 一定時間後に連続移動を開始するタイマーをセット
    this.holdTimeout = setTimeout(() => {
      this.continuousMoveInterval = setInterval(() => {
        switch (direction) {
          case 'left': this.moveLeft(); break;
          case 'right': this.moveRight(); break;
          case 'down': this.softDrop(); break;
        }
      }, REPEAT_INTERVAL);
    }, HOLD_DELAY);
  }

  // ★★★ 新しいメソッド：ボタンが離された時の処理 ★★★
  stopMove(): void {
    clearTimeout(this.holdTimeout);
    clearInterval(this.continuousMoveInterval);
  }


  private spawnPiece(specificTypeId?: number) {
    let typeId: number; if (specificTypeId) { typeId = specificTypeId; } else { this.ensureQueueIsFull(); typeId = this.pieceQueue.shift()!; this.nextPieces$.next(this.pieceQueue.slice(0, 4)); } const shape = SHAPES[typeId].shape; this.piece = { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0, shape: shape, typeId: typeId, }; if (!this.isValidPosition(this.piece.x, this.piece.y, this.piece.shape)) {
      this.isGameOver$.next(true);
      clearInterval(this.gameInterval);
      clearInterval(this.timeInterval); // ★ ゲームオーバー時に時間タイマーも停止
      // ★ ゲームオーバー時にBGMを停止
      this.stopBgm();
    }
    // ★ ゴーストピースの位置を計算
    this.updateGhostPiece();
  }

  private lockPiece() {
    this.piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          if (this.piece.y + y >= 0) {
            this.board[this.piece.y + y][this.piece.x + x] = value;
          }
        }
      });
    });
    this.canHold = true;
    this.clearLines();
    // ★ 次のピースを生成する処理をここに戻す
    this.spawnPiece();
  }

  // ★★★ ここから下の新しいメソッドをクラスの末尾に追加 ★★★

  /**
   * BGMを再生する
   */
  private playBgm(): void {
    if (!this.isMuted) {
      // play()はPromiseを返すため、ユーザー操作起因でない再生エラーをキャッチする
      this.bgm.play().catch(error => {
        console.warn('BGMの自動再生がブラウザにブロックされました。', error);
        // ユーザーが一度画面をクリック/タップしたら再生を試みるリスナーを追加
        const playOnFirstInteraction = () => {
          this.bgm.play();
          window.removeEventListener('click', playOnFirstInteraction);
          window.removeEventListener('keydown', playOnFirstInteraction);
        };
        window.addEventListener('click', playOnFirstInteraction);
        window.addEventListener('keydown', playOnFirstInteraction);
      });
    }
  }

  /**
   * BGMを停止する
   */
  private stopBgm(): void {
    this.bgm.pause();
    this.bgm.currentTime = 0; // 曲を最初に戻す
  }

  /**
   * BGMのミュートを切り替える（将来のボタン実装用）
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.playBgm();
    }
  }
  // ★★★ ここまで ★★★

  private clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell > 0)) {
        this.board.splice(y, 1);
        linesCleared++;
      }
    }
    for (let i = 0; i < linesCleared; i++) {
      this.board.unshift(Array(BOARD_WIDTH).fill(0));
    }

    if (linesCleared > 0) {
      // 効果音を再生
      this.clearSound.play().catch(error => console.error("Audio play failed:", error));

      const currentScore = this.score$.getValue();
      const basePoints = linesCleared * 100;
      const bonusPoints = [0, 0, 100, 300, 500][linesCleared];
      const totalPoints = basePoints + bonusPoints;
      this.score$.next(currentScore + totalPoints);
    }
  }
  private ensureQueueIsFull() { if (this.pieceQueue.length < 7) { const newBag = this.createShuffledBag(); this.pieceQueue.push(...newBag); } }
  private createShuffledBag(): number[] { const bag = [1, 2, 3, 4, 5, 6, 7]; for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[bag[i], bag[j]] = [bag[j], bag[i]]; } return bag; }
  private updateBoard() {
    const newBoard = this.board.map(row => [...row]);

    // ★★★ ここからが変更点 ★★★

    // 1. ゴーストピースを描画する
    if (this.ghostPiece) {
      this.ghostPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            const boardY = this.ghostPiece.y + y;
            if (boardY >= 0) {
              // ゴーストピース用の状態でセルを埋める
              newBoard[boardY][this.ghostPiece.x + x] = GHOST_PIECE_STATE;
            }
          }
        });
      });
    }

    // 2. 現在のピースをその上に描画する
    if (this.piece) {
      this.piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            const boardY = this.piece.y + y;
            if (boardY >= 0) {
              newBoard[boardY][this.piece.x + x] = value;
            }
          }
        });
      });
    }

    // ★★★ ここまで ★★★

    this.board$.next(newBoard);
  }
  private isValidPosition(x: number, y: number, shape: number[][]): boolean { for (let row = 0; row < shape.length; row++) { for (let col = 0; col < shape[row].length; col++) { if (shape[row][col] > 0) { const boardX = x + col; const boardY = y + row; if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return false; if (this.board[boardY] && this.board[boardY][boardX] > 0) return false; } } } return true; }
  private rotateMatrix(matrix: number[][]): number[][] { const N = matrix.length; const newMatrix = Array.from({ length: N }, () => Array(N).fill(0)); for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { newMatrix[j][N - 1 - i] = matrix[i][j]; } } return newMatrix; }
  private rotateMatrixCounterClockwise(matrix: number[][]): number[][] { const N = matrix.length; const newMatrix = Array.from({ length: N }, () => Array(N).fill(0)); for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { newMatrix[N - 1 - j][i] = matrix[i][j]; } } return newMatrix; }
  private createEmptyBoard(): number[][] { return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)); }
  private resetGameInterval() { clearInterval(this.gameInterval); this.gameInterval = setInterval(() => { this.gameLoop(); }, this.fallSpeed); }

  /**
    * ★ 新しいメソッド
    * ゴーストピースの位置を計算して更新する
    */
  private updateGhostPiece(): void {
    // 現在のピースを元にゴーストピースを作成
    this.ghostPiece = { ...this.piece, shape: this.piece.shape.map(row => [...row]) };

    // 衝突するまでY座標を下げ続ける
    while (this.isValidPosition(this.ghostPiece.x, this.ghostPiece.y + 1, this.ghostPiece.shape)) {
      this.ghostPiece.y++;
    }
  }
}
