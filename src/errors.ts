export class ThueError extends Error {}

export class ThueSyntaxError extends ThueError {}
export class ThueStopSignal extends ThueError {}
export class ThueRuntimeError extends ThueError {}

export class ThueInputError extends ThueRuntimeError {}
