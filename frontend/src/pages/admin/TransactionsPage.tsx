import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

// Mock transaction data
const mockTransactions = [
  {
    id: 1,
    bookId: 101,
    bookTitle: 'To Kill a Mockingbird',
    userId: 201,
    userName: 'John Doe',
    userRole: 'Student',
    issueDate: '2023-05-10',
    dueDate: '2023-05-24',
    returnDate: null,
    status: 'Borrowed',
    fine: 0
  },
  {
    id: 2,
    bookId: 102,
    bookTitle: '1984',
    userId: 202,
    userName: 'Jane Smith',
    userRole: 'Teacher',
    issueDate: '2023-04-15',
    dueDate: '2023-04-30',
    returnDate: '2023-04-28',
    status: 'Returned',
    fine: 0
  },
  {
    id: 3,
    bookId: 103,
    bookTitle: 'The Great Gatsby',
    userId: 203,
    userName: 'Robert Johnson',
    userRole: 'Student',
    issueDate: '2023-05-01',
    dueDate: '2023-05-15',
    returnDate: null,
    status: 'Overdue',
    fine: 5.50
  },
  {
    id: 4,
    bookId: 104,
    bookTitle: 'Pride and Prejudice',
    userId: 204,
    userName: 'Emily Davis',
    userRole: 'Teacher',
    issueDate: '2023-05-05',
    dueDate: '2023-05-20',
    returnDate: null,
    status: 'Borrowed',
    fine: 0
  },
  {
    id: 5,
    bookId: 105,
    bookTitle: 'The Hobbit',
    userId: 205,
    userName: 'Michael Wilson',
    userRole: 'Student',
    issueDate: '2023-04-20',
    dueDate: '2023-05-04',
    returnDate: '2023-05-10',
    status: 'Returned',
    fine: 3.00
  }
];

// Mock books available for issue
const mockBooks = [
  { id: 101, title: 'To Kill a Mockingbird', author: 'Harper Lee', copies: 5 },
  { id: 102, title: '1984', author: 'George Orwell', copies: 3 },
  { id: 103, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', copies: 2 },
  { id: 104, title: 'Pride and Prejudice', author: 'Jane Austen', copies: 4 },
  { id: 105, title: 'The Hobbit', author: 'J.R.R. Tolkien', copies: 3 },
  { id: 106, title: 'The Catcher in the Rye', author: 'J.D. Salinger', copies: 2 },
  { id: 107, title: 'Lord of the Flies', author: 'William Golding', copies: 3 },
  { id: 108, title: 'Animal Farm', author: 'George Orwell', copies: 4 },
];

// Mock users
const mockUsers = [
  { id: 201, name: 'John Doe', email: 'john.doe@example.com', role: 'Student' },
  { id: 202, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Teacher' },
  { id: 203, name: 'Robert Johnson', email: 'robert.johnson@example.com', role: 'Student' },
  { id: 204, name: 'Emily Davis', email: 'emily.davis@example.com', role: 'Teacher' },
  { id: 205, name: 'Michael Wilson', email: 'michael.wilson@example.com', role: 'Student' },
];

interface Transaction {
  id: number;
  bookId: number;
  bookTitle: string;
  userId: number;
  userName: string;
  userRole: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'Borrowed' | 'Returned' | 'Overdue';
  fine: number;
}

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 14)) // Default due date is 14 days from now
  );

  const handleIssueBook = () => {
    if (!selectedBook || !selectedUser || !issueDate || !dueDate) {
      return;
    }

    const book = mockBooks.find(b => b.id === selectedBook);
    const user = mockUsers.find(u => u.id === selectedUser);

    if (!book || !user) {
      return;
    }

    const newTransaction: Transaction = {
      id: Math.max(...transactions.map(t => t.id)) + 1,
      bookId: book.id,
      bookTitle: book.title,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      issueDate: format(issueDate, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      returnDate: null,
      status: 'Borrowed',
      fine: 0
    };

    setTransactions([...transactions, newTransaction]);
    setIsIssueDialogOpen(false);
    setSelectedBook(null);
    setSelectedUser(null);
  };

  const handleReturnBook = (id: number) => {
    const today = new Date();
    
    setTransactions(transactions.map(transaction => {
      if (transaction.id === id) {
        const returnDate = format(today, 'yyyy-MM-dd');
        const dueDate = new Date(transaction.dueDate);
        
        // Calculate fine if overdue (assuming $0.50 per day)
        let fine = 0;
        if (today > dueDate) {
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          fine = diffDays * 0.5;
        }
        
        return {
          ...transaction,
          returnDate,
          status: 'Returned',
          fine
        };
      }
      return transaction;
    }));
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by search term
    const matchesSearch = 
      transaction.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'borrowed') {
      return matchesSearch && transaction.status === 'Borrowed';
    } else if (activeTab === 'returned') {
      return matchesSearch && transaction.status === 'Returned';
    } else if (activeTab === 'overdue') {
      return matchesSearch && transaction.status === 'Overdue';
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Transactions</h1>
        <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
          <DialogTrigger asChild>
            <Button>Issue New Book</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue New Book</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="book" className="text-right">Book</Label>
                <Select 
                  value={selectedBook?.toString() || ''} 
                  onValueChange={(value) => setSelectedBook(Number(value))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBooks.map(book => (
                      <SelectItem key={book.id} value={book.id.toString()}>
                        {book.title} by {book.author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">User</Label>
                <Select 
                  value={selectedUser?.toString() || ''} 
                  onValueChange={(value) => setSelectedUser(Number(value))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="issueDate" className="text-right">Issue Date</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate ? format(issueDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={issueDate}
                        onSelect={setIssueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleIssueBook}>Issue Book</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
          <TabsTrigger value="returned">Returned</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <TransactionTable 
            transactions={filteredTransactions} 
            onReturnBook={handleReturnBook} 
          />
        </TabsContent>
        <TabsContent value="borrowed" className="mt-4">
          <TransactionTable 
            transactions={filteredTransactions} 
            onReturnBook={handleReturnBook} 
          />
        </TabsContent>
        <TabsContent value="returned" className="mt-4">
          <TransactionTable 
            transactions={filteredTransactions} 
            onReturnBook={handleReturnBook} 
          />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          <TransactionTable 
            transactions={filteredTransactions} 
            onReturnBook={handleReturnBook} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TransactionTableProps {
  transactions: Transaction[];
  onReturnBook: (id: number) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onReturnBook }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Book</th>
                <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Issue Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Due Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Return Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Fine</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">{transaction.id}</td>
                  <td className="p-4 align-middle">{transaction.bookTitle}</td>
                  <td className="p-4 align-middle">
                    {transaction.userName}
                    <div className="text-xs text-muted-foreground">{transaction.userRole}</div>
                  </td>
                  <td className="p-4 align-middle">{transaction.issueDate}</td>
                  <td className="p-4 align-middle">{transaction.dueDate}</td>
                  <td className="p-4 align-middle">{transaction.returnDate || '-'}</td>
                  <td className="p-4 align-middle">
                    <Badge 
                      variant={
                        transaction.status === 'Borrowed' 
                          ? 'outline' 
                          : transaction.status === 'Returned' 
                            ? 'success' 
                            : 'destructive'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    {transaction.fine > 0 ? `$${transaction.fine.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-4 align-middle">
                    {transaction.status === 'Borrowed' || transaction.status === 'Overdue' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onReturnBook(transaction.id)}
                      >
                        Return Book
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsPage; 