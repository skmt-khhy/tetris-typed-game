import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoldPiece } from './hold-piece';

describe('HoldPiece', () => {
  let component: HoldPiece;
  let fixture: ComponentFixture<HoldPiece>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoldPiece]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoldPiece);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
