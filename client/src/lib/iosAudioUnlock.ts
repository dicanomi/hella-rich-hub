/**
 * iOS Audio Unlock — stub for compatibility
 * In the hub, we handle audio unlock via user interaction directly.
 */
export async function resumeContext(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
