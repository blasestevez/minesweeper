import { JsonPipe, NgClass } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TouchedChangeEvent } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

let height = 9;
let width = 9;
let mines = 10;

let bombPositions: {y: number, x: number}[] = []; 
let nearbyNumberPositions: {y: number, x: number}[] = [
  {y: -1, x: -1},
  {y: -1, x: 0},
  {y: -1, x: 1},
  {y: 0, x: -1},
  {y: 0, x: 1},
  {y: 1, x: -1},
  {y: 1, x: 0},
  {y: 1, x: 1},
];

let floodFillPositions: {y: number, x: number}[] = [
 {y: -1, x: 0},
 {y: 0, x: -1},
 {y: 0, x: 1},
 {y: 1, x: 0}
]

let isGameOver = false;
let isGameWon = false;

let totalReveals = 0;
let revealCounter = 0;

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
  
  matrix: Cell[][] = [];
  triggeredCell: Cell | null = null;
  private longPressTimer: any = null;

  constructor(){
    this.generateGame();
  }

  generateGame(){
    totalReveals = (height*width) - mines;

    for (let i = 0; i < height; i++) {
      let row: Cell[] = new Array(width).fill(null).map((_, j) => ({
        posY: i,
        posX: j,
        isBomb: false,
        bombsNearby: 0,
        isFlagged: false,
        isRevealed: false,
      }));
      this.matrix.push(row);
    }
    
    this.placeMines();
    this.calculateNearbyNumbers();
  }
  
  placeMines() {
    let mineCount = 0;

    while(mineCount < mines) {
      let newPosY: number = Math.floor(Math.random() * height);
      let newPosX: number = Math.floor(Math.random() * width);
      
      if (!this.matrix[newPosY][newPosX].isBomb) {
        this.matrix[newPosY][newPosX].isBomb = true;
        bombPositions.push({y: newPosY, x: newPosX});
        mineCount++;
      }
    }
  }
  
  calculateNearbyNumbers() {
    bombPositions.forEach(({y,x}) => {
      for (let i = 0; i < nearbyNumberPositions.length; i++) {
        let newPosY = y + nearbyNumberPositions[i].y;
        let newPosX = x + nearbyNumberPositions[i].x;
        
        if(newPosY >= 0 && newPosY < height && newPosX >= 0 && newPosX < width && !this.matrix[newPosY][newPosX].isBomb) {
          this.matrix[newPosY][newPosX].bombsNearby++;
        }
      }
    });
  }

  revealCell(cell: Cell) {
    if (isGameOver || isGameWon) return;
    if (cell.isFlagged || cell.isRevealed) return;

    cell.isRevealed = true;
    revealCounter++;

    if (cell.bombsNearby === 0) {
      this.floodFill(cell);
    }

    if (revealCounter === totalReveals) {
      this.gameWon();
    }
    if (cell.isBomb) {
      this.triggeredCell = cell;
      this.gameOver();
    }
  }
  
  flagCell(cell: Cell, event: MouseEvent) {
    event.preventDefault();
    if (isGameOver || isGameWon) return;
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
  }
  
  gameOver() {
    isGameOver = true;
    bombPositions.forEach(({y,x}) => {
      this.matrix[y][x].isRevealed = true;
      this.matrix[y][x].isFlagged = false;
    });
    alert("Game Over!");
  }

  gameWon() {
    isGameWon = true;
    bombPositions.forEach(({y,x}) => {
      this.matrix[y][x].isFlagged = true;
    });
    alert("Game Won!");
  }

  floodFill(cell: Cell) {
    floodFillPositions.forEach(({y,x}) => {
      let newPosY = cell.posY + y;
      let newPosX = cell.posX + x;

      if (newPosY >= 0 && newPosY < height && newPosX >= 0 && newPosX < width) {
        let neighbor = this.matrix[newPosY][newPosX];
        if(!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isBomb) {
          neighbor.isRevealed = true;
          revealCounter++;

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


