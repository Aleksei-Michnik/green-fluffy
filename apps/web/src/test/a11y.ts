import axe, { type RunOptions } from 'axe-core';
import { expect } from 'vitest';

/* jsdom has no layout engine, so colour contrast is checked by the Playwright
   kit scan (apps/web/e2e/kit.spec.ts) instead of here. */
const defaults: RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
};

/** Fails with a readable list of axe violations found under `root`. */
export async function expectNoA11yViolations(
  root: Element | Document = document,
  options: RunOptions = {},
): Promise<void> {
  const results = await axe.run(root, { ...defaults, ...options });
  const report = results.violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n` +
        violation.nodes.map((node) => `  ${node.html}`).join('\n'),
    )
    .join('\n');
  expect(report, 'axe violations').toBe('');
}
