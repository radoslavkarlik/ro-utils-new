import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';

type Props = HTMLAttributes<HTMLTableRowElement> & {
  readonly ref?: RefObject<HTMLTableRowElement>;
};

export function TableRow({
  children,
  className,
  ref,
  ...props
}: Props): ReactNode {
  return (
    <tr
      ref={ref}
      className={cn(
        'border border-indigo-700 bg-indigo-100 nth-[2n]:bg-indigo-200 text-indigo-950 hover:cursor-pointer hover:bg-indigo-300 hover:nth-[2n]:bg-indigo-300',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}
