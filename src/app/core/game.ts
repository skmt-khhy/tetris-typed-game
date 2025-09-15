import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SHAPES } from './shapes';
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
interface Piece { x: number; y: number; shape: number[][]; typeId: number; }

@Injectable({ providedIn: 'root' })
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
  private gameInterval: any;
  private continuousMoveInterval: any; // ★追加

  constructor() { }

  start() {
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.stopContinuousMove(); // ★追加
    this.board = this.createEmptyBoard();
    this.score$.next(0);
    this.isGameOver$.next(false);
    this.pieceQueue = [];
    this.holdPieceId = 0;
    this.holdPiece$.next(this.holdPieceId);
    this.canHold = true;
    this.ensureQueueIsFull();
    this.spawnPiece();
    this.updateBoard();
    this.gameInterval = setInterval(() => { this.gameLoop(); }, 1000);
  }

  // ★★★ ここから新しいメソッド ★★★
  startContinuousMove(direction: 'left' | 'right' | 'down'): void {
    if (this.isGameOver$.getValue()) return;
    switch (direction) {
      case 'left': this.moveLeft(); break;
      case 'right': this.moveRight(); break;
      case 'down': this.softDrop(); break;
    }
    this.stopContinuousMove();
    this.continuousMoveInterval = setInterval(() => {
      switch (direction) {
        case 'left': this.moveLeft(); break;
        case 'right': this.moveRight(); break;
        case 'down': this.softDrop(); break;
      }
    }, 100);
  }
  stopContinuousMove(): void {
    clearInterval(this.continuousMoveInterval);
  }
  // ★★★ ここまで新しいメソッド ★★★

  hold() {
    if (this.isGameOver$.getValue() || !this.canHold) return;
    if (this.holdPieceId === 0) {
      this.holdPieceId = this.piece.typeId;
      this.spawnPiece();
    } else {
      const previouslyHeldId = this.holdPieceId;
      this.holdPieceId = this.piece.typeId;
      this.spawnPiece(previouslyHeldId);
    }
    this.canHold = false;
    this.holdPiece$.next(this.holdPieceId);
    this.updateBoard();
  }

  // ... (以降のメソッドは変更なし)
  moveLeft(): void { if (this.isGameOver$.getValue()) return; const nextX = this.piece.x - 1; if (this.isValidPosition(nextX, this.piece.y, this.piece.shape)) { this.piece.x = nextX; this.updateBoard(); } }
  moveRight(): void { if (this.isGameOver$.getValue()) return; const nextX = this.piece.x + 1; if (this.isValidPosition(nextX, this.piece.y, this.piece.shape)) { this.piece.x = nextX; this.updateBoard(); } }
  rotate(): void { if (this.isGameOver$.getValue()) return; const rotatedShape = this.rotateMatrix(this.piece.shape); if (this.isValidPosition(this.piece.x, this.piece.y, rotatedShape)) { this.piece.shape = rotatedShape; this.updateBoard(); } }
  rotateCounterClockwise(): void { if (this.isGameOver$.getValue()) return; const rotatedShape = this.rotateMatrixCounterClockwise(this.piece.shape); if (this.isValidPosition(this.piece.x, this.piece.y, rotatedShape)) { this.piece.shape = rotatedShape; this.updateBoard(); } }
  softDrop(): void { if (this.isGameOver$.getValue()) return; const nextY = this.piece.y + 1; if (this.isValidPosition(this.piece.x, nextY, this.piece.shape)) { this.piece.y = nextY; } else { this.lockPiece(); this.spawnPiece(); } this.updateBoard(); }
  hardDrop(): void { if (this.isGameOver$.getValue()) return; while (this.isValidPosition(this.piece.x, this.piece.y + 1, this.piece.shape)) { this.piece.y++; } this.lockPiece(); this.spawnPiece(); this.updateBoard(); }
  private gameLoop() { if (this.isGameOver$.getValue()) { clearInterval(this.gameInterval); return; } this.softDrop(); }
  private spawnPiece(specificTypeId?: number) { let typeId: number; if (specificTypeId) { typeId = specificTypeId; } else { this.ensureQueueIsFull(); typeId = this.pieceQueue.shift()!; this.nextPieces$.next(this.pieceQueue.slice(0, 4)); } const shape = SHAPES[typeId].shape; this.piece = { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0, shape: shape, typeId: typeId, }; if (!this.isValidPosition(this.piece.x, this.piece.y, this.piece.shape)) { this.isGameOver$.next(true); clearInterval(this.gameInterval); } }
  private lockPiece() { this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) { if (this.piece.y + y >= 0) { this.board[this.piece.y + y][this.piece.x + x] = value; } } }); }); this.canHold = true; this.clearLines(); }
  private ensureQueueIsFull() { if (this.pieceQueue.length < 7) { const newBag = this.createShuffledBag(); this.pieceQueue.push(...newBag); } }
  private createShuffledBag(): number[] { const bag = [1, 2, 3, 4, 5, 6, 7]; for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[bag[i], bag[j]] = [bag[j], bag[i]]; } return bag; }
  private clearLines() { let linesCleared = 0; for (let y = BOARD_HEIGHT - 1; y >= 0; y--) { if (this.board[y].every(cell => cell > 0)) { this.board.splice(y, 1); linesCleared++; } } for (let i = 0; i < linesCleared; i++) { this.board.unshift(Array(BOARD_WIDTH).fill(0)); } if (linesCleared > 0) { const currentScore = this.score$.getValue(); this.score$.next(currentScore + linesCleared * 100); } }
  private updateBoard() { const newBoard = this.board.map(row => [...row]); if (this.piece) { this.piece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) { const boardY = this.piece.y + y; if (boardY >= 0) { newBoard[boardY][this.piece.x + x] = value; } } }); }); } this.board$.next(newBoard); }
  private isValidPosition(x: number, y: number, shape: number[][]): boolean { for (let row = 0; row < shape.length; row++) { for (let col = 0; col < shape[row].length; col++) { if (shape[row][col] > 0) { const boardX = x + col; const boardY = y + row; if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return false; if (this.board[boardY] && this.board[boardY][boardX] > 0) return false; } } } return true; }
  private rotateMatrix(matrix: number[][]): number[][] { const N = matrix.length; const newMatrix = Array.from({ length: N }, () => Array(N).fill(0)); for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { newMatrix[j][N - 1 - i] = matrix[i][j]; } } return newMatrix; }
  private rotateMatrixCounterClockwise(matrix: number[][]): number[][] { const N = matrix.length; const newMatrix = Array.from({ length: N }, () => Array(N).fill(0)); for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { newMatrix[N - 1 - j][i] = matrix[i][j]; } } return newMatrix; }
  private createEmptyBoard(): number[][] { return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)); }
}
