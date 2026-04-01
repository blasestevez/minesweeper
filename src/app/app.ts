import { JsonPipe, NgClass } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

const nearbyNumberPositions: {y: number, x: number}[] = [
  {y: -1, x: -1},
  {y: -1, x: 0},
  {y: -1, x: 1},
  {y: 0, x: -1},
  {y: 0, x: 1},
  {y: 1, x: -1},
  {y: 1, x: 0},
  {y: 1, x: 1},
];

const floodFillPositions: {y: number, x: number}[] = [
 {y: -1, x: 0},
 {y: 0, x: -1},
 {y: 0, x: 1},
 {y: 1, x: 0}
]

interface Cell{
  posY: number;
  posX: number;
  isBomb: boolean;
  bombsNearby: number;
  isFlagged: boolean;
  isRevealed: boolean;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('minesweeper');
  //easy 9x9 10mines
  //medium 16x16 40mines
  //expert 30x16 99mines
  height: number  = 9;
  width: number = 9;
  mines: number = 10;
  matrix: Cell[][] = [];
  triggeredCell: Cell | null = null;
  isGameOver: boolean = false;
  isGameWon: boolean = false;
  private bombPositions: {y: number, x: number}[] = []; 
  private totalReveals: number = 0;
  private revealCounter: number = 0;
  private longPressTimer: any = null;
  private gameStarted: boolean = false;

  constructor(){
    this.generateGame();
  }

  generateGame(){
    this.totalReveals = (this.height*this.width) - this.mines;

    for (let i = 0; i < this.height; i++) {
      let row: Cell[] = new Array(this.width).fill(null).map((_, j) => ({
        posY: i,
        posX: j,
        isBomb: false,
        bombsNearby: 0,
        isFlagged: false,
        isRevealed: false,
      }));
      this.matrix.push(row);
    }
  }
  
  placeMines(firstCell: Cell) {
    let excludedCells: {y: number, x: number}[] = [];
    excludedCells.push({y: firstCell.posY, x: firstCell.posX});

    let mineCount = 0;

    while(mineCount < this.mines) {
      let newPosY: number = Math.floor(Math.random() * this.height);
      let newPosX: number = Math.floor(Math.random() * this.width);
      
      if (!this.matrix[newPosY][newPosX].isBomb && !excludedCells.some(c => c.y === newPosY && c.x === newPosX)) {
        this.matrix[newPosY][newPosX].isBomb = true;
        this.bombPositions.push({y: newPosY, x: newPosX});
        mineCount++;
      }
    }
  }
  
  calculateNearbyNumbers() {
    this.bombPositions.forEach(({y,x}) => {
      for (let i = 0; i < nearbyNumberPositions.length; i++) {
        let newPosY = y + nearbyNumberPositions[i].y;
        let newPosX = x + nearbyNumberPositions[i].x;
        
        if(newPosY >= 0 && newPosY < this.height && newPosX >= 0 && newPosX < this.width && !this.matrix[newPosY][newPosX].isBomb) {
          this.matrix[newPosY][newPosX].bombsNearby++;
        }
      }
    });
  }

  revealCell(cell: Cell) {
    if (this.isGameOver || this.isGameWon) return;
    if (cell.isFlagged || cell.isRevealed) return;

    if(!this.gameStarted) {
      this.gameStarted = true;
      this.placeMines(cell);
      this.calculateNearbyNumbers();
    }
    
    cell.isRevealed = true;
    this.revealCounter++;

    if (cell.bombsNearby === 0) {
      this.floodFill(cell);
    }

    if (this.revealCounter === this.totalReveals) {
      this.gameWon();
    }
    if (cell.isBomb) {
      this.triggeredCell = cell;
      this.gameOver();
    }
  }
  
  flagCell(cell: Cell, event: MouseEvent) {
    event.preventDefault();
    if (this.isGameOver || this.isGameWon) return;
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
  }
  
  gameOver() {
    this.isGameOver = true;
    this.bombPositions.forEach(({y,x}) => {
      this.matrix[y][x].isRevealed = true;
      this.matrix[y][x].isFlagged = false;
    });
    alert("Game Over!");
  }

  gameWon() {
    this.isGameWon = true;
    this.bombPositions.forEach(({y,x}) => {
      this.matrix[y][x].isFlagged = true;
    });
    alert("Game Won!");
  }

  floodFill(cell: Cell) {
    floodFillPositions.forEach(({y,x}) => {
      let newPosY = cell.posY + y;
      let newPosX = cell.posX + x;

      if (newPosY >= 0 && newPosY < this.height && newPosX >= 0 && newPosX < this.width) {
        let neighbor = this.matrix[newPosY][newPosX];
        if(!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isBomb) {
          neighbor.isRevealed = true;
          this.revealCounter++;

          if(neighbor.bombsNearby === 0){
            this.floodFill(neighbor);
          }
        }
      }
    })
  }

  onTouchStart(cell: Cell, event: TouchEvent) {
    event.preventDefault();
    this.longPressTimer = setTimeout(() => {
      this.flagCell(cell, event as any);
      this.longPressTimer = null;
    }, 300);
  }

  onTouchEnd(cell: Cell) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      this.revealCell(cell);
    }
  }
}


