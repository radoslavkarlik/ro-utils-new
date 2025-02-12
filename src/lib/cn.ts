import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const cn = (...inputs: ReadonlyArray<any>): string =>
  twMerge(clsx(...inputs));
