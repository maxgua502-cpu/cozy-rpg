import { describe, it, expect } from 'vitest';
import { joystickVector } from '../src/systems/joystick.js';

describe('joystickVector', () => {
  it('в центре — нулевой вектор', () => {
    const v = joystickVector(0, 0, 60);
    expect(v).toEqual({ thumbX: 0, thumbY: 0, dirX: 0, dirY: 0, magnitude: 0 });
  });

  it('внутри кольца — шляпка совпадает со смещением, сила пропорциональна', () => {
    const v = joystickVector(30, 0, 60);
    expect(v.thumbX).toBeCloseTo(30);
    expect(v.thumbY).toBeCloseTo(0);
    expect(v.dirX).toBeCloseTo(1);
    expect(v.magnitude).toBeCloseTo(0.5);
  });

  it('за кольцом — шляпка прижата к радиусу, сила = 1', () => {
    const v = joystickVector(200, 0, 60);
    expect(Math.hypot(v.thumbX, v.thumbY)).toBeCloseTo(60);
    expect(v.magnitude).toBeCloseTo(1);
    expect(v.dirX).toBeCloseTo(1);
  });

  it('направление нормализовано по диагонали', () => {
    const v = joystickVector(100, 100, 60);
    expect(Math.hypot(v.dirX, v.dirY)).toBeCloseTo(1);
    expect(v.dirX).toBeCloseTo(Math.SQRT1_2);
    expect(v.dirY).toBeCloseTo(Math.SQRT1_2);
  });

  it('нулевой радиус безопасен', () => {
    const v = joystickVector(10, 10, 0);
    expect(v.magnitude).toBe(0);
  });
});
