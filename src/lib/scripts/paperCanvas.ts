
import paper from 'paper';
import { Color } from 'paper/dist/paper-core';

export default function newPaperCanvas(node: HTMLCanvasElement) {
  // Get a reference to the canvas object
  const canvas = node;
  // var canvas = document.getElementById('paperCanvas');
  // Create an empty project and a view for the canvas:
  paper.setup(canvas);
  // Create a Paper.js Path to draw a line into it:
  const path = new paper.Path();
  // Give the stroke a color
  path.strokeColor = new Color(0);
  const start = new paper.Point(100, 100);
  // Move to start and draw a line from there
  path.moveTo(start);
  // Note that the plus operator on Point objects does not work
  // in JavaScript. Instead, we need to call the add() function:
  path.lineTo(start.add([200, -50]));
  // Draw the view now:
  
  paper.view.update();
}