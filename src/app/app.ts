import { Component } from '@angular/core';
import { GameBoardComponent } from './feature/game-board/game-board';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameBoardComponent], // 作成したGameBoardComponentを読み込む
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  title = 'tetris-typed-game';
}
