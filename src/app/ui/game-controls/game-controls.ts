import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/game';

@Component({
  selector: 'app-game-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-controls.html',
  styleUrls: ['./game-controls.scss']
})
export class GameControlsComponent {
  constructor(public gameService: GameService) { }

  // ★★★ 連続操作を開始するメソッド ★★★
  startMove(direction: 'left' | 'right' | 'down') {
    this.gameService.startContinuousMove(direction);
  }

  // ★★★ 連続操作を停止するメソッド ★★★
  stopMove() {
    this.gameService.stopContinuousMove();
  }
}
