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

  /**
   * ★★★ 修正されたメソッド ★★★
   * イベントオブジェクトを受け取り、preventDefault()を呼び出す
   */
  handlePress(direction: 'left' | 'right' | 'down', event: Event): void {
    // この一行が最重要。タッチイベントの後の重複マウスイベントを防ぐ
    event.preventDefault();

    this.gameService.startMove(direction);
  }

  handleRelease(): void {
    this.gameService.stopMove();
  }
}
