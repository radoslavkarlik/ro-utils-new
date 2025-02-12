import { cn } from '@/lib/cn';
import type { ReactNode, RefObject, ThHTMLAttributes } from 'react';

export type SortByState<TColumn extends string = string> = {
  readonly column: TColumn;
  readonly direction: 'asc' | 'desc';
};

type Props<TColumn extends string> = ThHTMLAttributes<HTMLTableCellElement> & {
  readonly id?: TColumn;
  readonly ref?: RefObject<HTMLTableCellElement>;
  readonly sortedBy?: SortByState<TColumn>;
};

export function TableHeaderCell<TColumn extends string>({
  children,
  className,
  ref,
  id,
  sortedBy,
  ...props
}: Props<TColumn>): ReactNode {
  return (
    <th
      ref={ref}
      className={cn('py-2', props.onClick && 'hover:cursor-pointer', className)}
      {...props}
    >
      {children}
      {sortedBy && sortedBy.column === id && (
        <SortIcon direction={sortedBy.direction} />
      )}
    </th>
  );
}

type SortIconProps = {
  readonly direction?: SortByState['direction'];
};

function SortIcon({ direction }: SortIconProps) {
  return <div>{direction === 'asc' ? 'DOWN' : 'UP'}</div>;
}
