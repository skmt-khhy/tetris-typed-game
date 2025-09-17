import { Component, HostListener, OnInit } from '@angular/core';
import { GameService } from '../../core/game';
import { CommonModule } from '@angular/common';
import { NextPieceComponent } from '../../ui/next-piece/next-piece';
import { HoldPieceComponent } from '../../ui/hold-piece/hold-piece';
import { GameControlsComponent } from '../../ui/game-controls/game-controls';

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
