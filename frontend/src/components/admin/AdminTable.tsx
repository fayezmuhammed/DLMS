import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';

interface AdminTableProps {
  columns: {
    key: string;
    title: string;
    className?: string;
  }[];
  data: any[];
  onRowClick?: (item: any) => void;
  renderCell: (item: any, column: string, index: number) => React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

const AdminTable: React.FC<AdminTableProps> = ({
  columns,
  data,
  onRowClick,
  renderCell,
  emptyMessage = "No data found.",
  isLoading = false
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow 
                    key={item._id || index}
                    className={onRowClick ? 'cursor-pointer' : ''}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${item._id || index}-${column.key}`} className={column.className}>
                        {renderCell(item, column.key, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTable; 