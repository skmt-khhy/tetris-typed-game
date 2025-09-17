import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { GameService, BOARD_WIDTH, BOARD_HEIGHT } from '../../core/game';
import { CommonModule } from '@angular/common';
import { NextPieceComponent } from '../../ui/next-piece/next-piece';
import { HoldPieceComponent } from '../../ui/hold-piece/hold-piece';
import { GameControlsComponent } from '../../ui/game-controls/game-controls';
import { Subscription } from 'rxjs'; // ★ Subscription をインポート

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, NextPieceComponent, HoldPieceComponent, GameControlsComponent],
  templateUrl: './game-board.html',
  styleUrls: ['./game-board.scss'],
})
export class GameBoardComponent implements OnInit, AfterViewInit, OnDestroy { // ★
  // ★★★ ここからが変更点 ★★★

  // canvas要素への参照を取得
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private subscription!: Subscription;

  // 定数

  // ★ CELL_SIZE を 20 にした変更を維持
  private readonly CELL_SIZE = 20;

  // ★★★ アニメーション用の色をCOLORS配列に追加 ★★★
  // ★★★ ゴーストピース用の色をCOLORS配列に追加 ★★★
  private readonly COLORS = [
    '#34495e', // 0: Empty
    '#3498db', // 1: I
    '#e67e22', // 2: L
    '#2980b9', // 3: J
    '#f1c40f', // 4: O
    '#2ecc71', // 5: S
    '#9b59b6', // 6: T
    '#e74c3c', // 7: Z
    // 8番目はアニメーションで使ったので空けておく
    '#ffffff', // 8: (未使用)
    'rgba(255, 255, 255, 0.3)', // 9: Ghost Piece
  ];

  constructor(public gameService: GameService) { }

  ngOnInit(): void {
    // GameServiceの状態を購読し、変更があるたびに描画処理を呼び出す
    this.subscription = this.gameService.board$.subscribe(board => {
      if (this.ctx) { // コンテキストが初期化されてから描画する
        this.drawBoard(board);
      }
    });
    this.gameService.start();
  }

  // Viewが初期化された後にcanvasのコンテキストを取得
  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = context;

    // canvasの解像度を設定
    canvas.width = BOARD_WIDTH * this.CELL_SIZE;
    canvas.height = BOARD_HEIGHT * this.CELL_SIZE;

    // スタイルでサイズを指定（高解像度ディスプレイ対応）
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }

  // コンポーネント破棄時に購読を解除
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * ボードの状態をcanvasに描画する
   * @param board 2次元配列のボードデータ
   */
  private drawBoard(board: number[][]): void {
    // 毎回キャンバスをクリア
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    board.forEach((row, y) => {
      row.forEach((cellValue, x) => {
        // 色を設定
        this.ctx.fillStyle = this.COLORS[cellValue];
        // 矩形を描画
        this.ctx.fillRect(
          x * this.CELL_SIZE,
          y * this.CELL_SIZE,
          this.CELL_SIZE,
          this.CELL_SIZE
        );

        // セルの境界線を描画
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.strokeRect(
          x * this.CELL_SIZE,
          y * this.CELL_SIZE,
          this.CELL_SIZE,
          this.CELL_SIZE
        );
      });
    });
  }
  // ★★★ ここまでが変更点 ★★★

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    // ★★★ event.preventDefault() をここから削除 ★★★

    switch (event.key.toLowerCase()) {
      case 'arrowleft':
        this.gameService.moveLeft();
        event.preventDefault(); // ★ ゲームで使うキーの場合にのみ呼び出す
        break;
      case 'arrowright':
        this.gameService.moveRight();
        event.preventDefault(); // ★
        break;
      case 'arrowdown':
        this.gameService.softDrop();
        event.preventDefault(); // ★
        break;
      case 'arrowup':
        this.gameService.hardDrop();
        event.preventDefault(); // ★
        break;
      case 'x':
        this.gameService.rotate();
        event.preventDefault(); // ★
        break;
      case 'z':
        this.gameService.rotateCounterClockwise();
        event.preventDefault(); // ★
        break;
      case ' ':
        this.gameService.hold();
        event.preventDefault(); // ★
        break;
    }
  }
}
