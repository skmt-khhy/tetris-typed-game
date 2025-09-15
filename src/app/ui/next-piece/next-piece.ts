import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/game';
import { SHAPES } from '../../core/shapes';

@Component({
  selector: 'app-next-piece',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './next-piece.html',
  styleUrls: ['./next-piece.scss']
})
export class NextPieceComponent implements OnInit {
  // ★ サービスから受け取った次のミノIDの配列を保持する
  public nextPieces: number[] = [];

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // GameServiceのnextPieces$を監視し、配列をそのまま受け取る
    this.gameService.nextPieces$.subscribe(pieceIds => {
      this.nextPieces = pieceIds;
    });
  }

  /**
   * ★★★ 新しいヘルパーメソッド ★★★
   * ミノのIDから、表示用の4x4行列を生成して返す
   * @param pieceId ミノのID (1-7)
   * @returns 4x4の2次元配列
   */
  public getPieceMatrix(pieceId: number): number[][] {
    const matrix = Array.from({ length: 4 }, () => Array(4).fill(0));
    if (pieceId > 0) {
      const shape = SHAPES[pieceId].shape;
      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            const offsetX = shape.length === 4 ? 0 : 1;
            const offsetY = shape.length === 4 ? 0 : 1;
            matrix[y + offsetY][x + offsetX] = value;
          }
        });
      });
    }
    return matrix;
  }
}
