import { Component, HostListener, OnInit } from '@angular/core';
import { GameService } from '../../core/game';
import { CommonModule } from '@angular/common';
import { NextPieceComponent } from '../../ui/next-piece/next-piece';
import { HoldPieceComponent } from '../../ui/hold-piece/hold-piece'; // ★ HoldPieceをインポート
import { GameControlsComponent } from '../../ui/game-controls/game-controls'; // ★ GameControlsをインポート

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, NextPieceComponent, HoldPieceComponent, GameControlsComponent],
  templateUrl: './game-board.html',
  styleUrls: ['./game-board.scss'],
})
export class GameBoardComponent implements OnInit {
  constructor(public gameService: GameService) { }
  ngOnInit(): void {
    this.gameService.start();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    event.preventDefault();
    // キー入力を小文字に変換して、'x'と'X'の両方に対応
    switch (event.key.toLowerCase()) {
      // --- 左右移動とソフトドロップ（変更なし） ---
      case 'arrowleft': this.gameService.moveLeft(); break;
      case 'arrowright': this.gameService.moveRight(); break;
      case 'arrowdown': this.gameService.softDrop(); break;

      // ★★★ ここからが変更箇所 ★★★
      case 'arrowup': // ↑キー
        this.gameService.hardDrop(); // ハードドロップを実行
        break;
      case 'x': // xキー
        this.gameService.rotate(); // 右回転を実行
        break;
      case 'z': // zキー
        this.gameService.rotateCounterClockwise(); // 左回転を実行
        break;
      // ★★★ ここまでが変更箇所 ★★★
      case ' ':
        this.gameService.hold();
        break;
    }
  }
}
