import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/game';
import { SHAPES } from '../../core/shapes';

@Component({
  selector: 'app-hold-piece',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hold-piece.html',
  styleUrls: ['./hold-piece.scss']
})
export class HoldPieceComponent implements OnInit {
  public pieceMatrix: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // GameServiceのholdPiece$を監視する
    this.gameService.holdPiece$.subscribe(pieceId => {
      this.updateHoldPiece(pieceId);
    });
  }

  private updateHoldPiece(pieceId: number) {
    this.pieceMatrix = Array.from({ length: 4 }, () => Array(4).fill(0));
    if (pieceId > 0) {
      const shape = SHAPES[pieceId].shape;
      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            const offsetX = shape.length === 4 ? 0 : 1;
            const offsetY = shape.length === 4 ? 0 : 1;
            this.pieceMatrix[y + offsetY][x + offsetX] = value;
          }
        });
      });
    }
  }
}
