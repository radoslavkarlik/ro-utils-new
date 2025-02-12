import { Table } from '@/ui/table/table';
import { TableBody } from '@/ui/table/table-body';
import { TableHeader } from '@/ui/table/table-header';
import { TableHeaderCell } from '@/ui/table/table-header-cell';
import { TableRow } from '@/ui/table/table-row';
import { type Table as TableModel, flexRender } from '@tanstack/react-table';
import type { ReactNode } from 'react';

type Props<TData> = {
  readonly table: TableModel<TData>;
};

export function DataTable<TData>({ table }: Props<TData>): ReactNode {
  return (
    <Table>
      <TableHeader>
        {table.getFlatHeaders().map((header) => (
          <TableHeaderCell key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHeaderCell>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row
              .getVisibleCells()
              .map((cell) =>
                flexRender(cell.column.columnDef.cell, cell.getContext()),
              )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
