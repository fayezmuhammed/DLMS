import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction, transactionService } from '@/services/transactionService';
import { bookService, Book } from '@/services/bookService';
import { toast } from '@/components/ui/use-toast';
import { userService } from '@/services/userService';
import settingsService, { BorrowingRules } from '@/services/settingsService';

const TransactionsPageAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('student');
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 14)) // Default due date
  );
  const [issuingBook, setIssuingBook] = useState(false);
  const [borrowingRules, setBorrowingRules] = useState<BorrowingRules>({
    maxBooksStudent: 3,
    maxBooksTeacher: 5,
    maxDaysStudent: 14,
    maxDaysTeacher: 30,
    finePerDay: 0.5
  });

  useEffect(() => {
    fetchTransactions();
    fetchBorrowingRules();
  }, [activeTab]);

  useEffect(() => {
    // Apply filtering based on search term and selected status
    if (transactions.length > 0) {
      let filtered = [...transactions];
      
      // Filter by search term (book title or user name)
      if (searchTerm.trim() !== '') {
        filtered = filtered.filter(transaction => {
          const book = typeof transaction.book === 'object' ? transaction.book : null;
          const bookTitle = book?.title || '';
          
          // Handle user as either string or object
          let userName = '';
          if (typeof transaction.user === 'object') {
            userName = transaction.user.name || '';
            const userEmail = transaction.user.email || '';
            return bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  userEmail.toLowerCase().includes(searchTerm.toLowerCase());
          } else {
            userName = 'User ID: ' + transaction.user;
            return bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  userName.toLowerCase().includes(searchTerm.toLowerCase());
          }
        });
      }
      
      // Filter by status
      if (selectedStatus !== 'all') {
        filtered = filtered.filter(transaction => 
          transaction.status === selectedStatus
        );
      }
      
      setFilteredTransactions(filtered);
    }
  }, [searchTerm, selectedStatus, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (activeTab) {
        case 'active':
          response = await transactionService.getActiveTransactions();
          break;
        case 'overdue':
          response = await transactionService.getOverdueTransactions();
          break;
        default:
          response = await transactionService.getAllTransactions();
          break;
      }
      
      if (response.success && response.data) {
        setTransactions(response.data);
        setFilteredTransactions(response.data);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      // Get all books, not just those with status 'Available'
      const response = await bookService.getBooks();
      
      if (response.success && response.data) {
        // Filter to find books that have available copies
        const availableBooksData = await Promise.all(
          response.data.map(async (book) => {
            // Count active transactions for each book
            const transactionsResponse = await transactionService.getBookTransactions(book._id);
            
            if (transactionsResponse.success) {
              const activeTransactions = transactionsResponse.data.filter(
                (tx) => tx.status === 'borrowed' || tx.status === 'overdue'
              ).length;
              
              // Book is available if it has more copies than active transactions
              return book.copies > activeTransactions ? book : null;
            }
            
            return null;
          })
        );
        
        // Filter out null values
        setAvailableBooks(availableBooksData.filter(book => book !== null));
      } else {
        toast({
          title: "Error",
          description: "Failed to load available books.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching available books:', err);
      toast({
        title: "Error",
        description: "Failed to load available books.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      // Replace the mock data with a real API call using userService
      const response = await userService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load users.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const fetchBorrowingRules = async () => {
    try {
      const response = await settingsService.getBorrowingRules();
      if (response.success && response.data) {
        setBorrowingRules(response.data);
      }
    } catch (err) {
      console.error('Error fetching borrowing rules:', err);
      toast({
        title: "Error",
        description: "Failed to load borrowing rules.",
        variant: "destructive",
      });
    }
  };

  const handleOpenIssueDialog = () => {
    fetchAvailableBooks();
    fetchUsers();
    setIsIssueDialogOpen(true);
  };

  const handleIssueBook = async () => {
    if (!selectedBook || !selectedUser || !issueDate || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIssuingBook(true);
      
      // Use the transactionService to issue the book to the selected user
      const response = await transactionService.issueBook({
        bookId: selectedBook,
        userId: selectedUser,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString()
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Book issued successfully",
        });
        
    setIsIssueDialogOpen(false);
    setSelectedBook(null);
    setSelectedUser(null);
        
        // Refresh transactions
        fetchTransactions();
      } else {
        toast({
          title: "Failed to issue book",
          description: response.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error issuing book:', err);
      toast({
        title: "Error",
        description: "Failed to issue the book. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIssuingBook(false);
    }
  };
  
  const handleManualReturn = async (transaction: Transaction) => {
    if (!transaction || typeof transaction.book !== 'object') return;
    
    try {
      const bookId = transaction.book._id;
      const response = await transactionService.returnBook(bookId);
      
      if (response.success) {
        toast({
          title: "Book returned successfully",
          description: "The book has been marked as returned in the system.",
        });
        // Refresh the transactions list
        fetchTransactions();
      } else {
        toast({
          title: "Failed to return book",
          description: response.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error returning book:', err);
      toast({
        title: "Error",
        description: "Failed to return the book. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'borrowed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysOverdue = (dueDate: string) => {
    return transactionService.calculateOverdueDays(dueDate);
  };

  const calculateFine = (dueDate: string) => {
    const { fineAmount } = transactionService.calculateFine(dueDate, borrowingRules);
    return fineAmount;
  };

  // Helper function to get book details from transaction
  const getBookDetails = (transaction: Transaction) => {
    if (typeof transaction.book === 'object') {
      return {
        title: transaction.book.title,
        author: transaction.book.author,
        id: transaction.book._id
      };
        }
        
        return {
      title: 'Unknown Book',
      author: 'Unknown Author',
      id: transaction.book
    };
  };

  if (loading) {
    return <div className="text-center py-12">Loading transactions...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => fetchTransactions()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold">Manage Transactions</h1>
          <p className="text-muted-foreground">
            View and manage borrowing records for all users
          </p>
        </div>
        
        <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenIssueDialog}>Issue New Book</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue New Book</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="book" className="text-right">Book</Label>
                <Select 
                  value={selectedBook || ''} 
                  onValueChange={setSelectedBook}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map(book => (
                      <SelectItem key={book._id} value={book._id}>
                        {book.title} by {book.author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">User</Label>
                <Select 
                  value={selectedUser || ''} 
                  onValueChange={(userId) => {
                    setSelectedUser(userId);
                    
                    // Find the selected user to get their role
                    const user = users.find(u => u._id === userId);
                    if (user) {
                      const userRole = user.role.toLowerCase();
                      setSelectedUserRole(userRole);
                      
                      // Set due date based on user role if issue date exists
                      if (issueDate) {
                        const daysToAdd = userRole === 'teacher' ? 
                          borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent;
                        
                        const newDueDate = new Date(issueDate);
                        newDueDate.setDate(newDueDate.getDate() + daysToAdd);
                        setDueDate(newDueDate);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
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
                        onSelect={(date) => {
                          setIssueDate(date);
                          
                          // Recalculate due date when issue date changes
                          if (date && selectedUser) {
                            const daysToAdd = selectedUserRole === 'teacher' ? 
                              borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent;
                            
                            const newDueDate = new Date(date);
                            newDueDate.setDate(newDueDate.getDate() + daysToAdd);
                            setDueDate(newDueDate);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <div className="col-span-3">
                  <div className="flex gap-2 items-center">
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
                          disabled={(date) => date < (issueDate || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="text-xs text-muted-foreground">
                      Based on {selectedUserRole === 'teacher' ? 'teacher' : 'student'} borrowing rules
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>Cancel</Button>
              <Button 
                disabled={issuingBook}
                onClick={handleIssueBook}
              >
                {issuingBook ? 'Processing...' : 'Issue Book'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
        <Input
            placeholder="Search by book title or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="w-full md:w-72">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="borrowed">Borrowed</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button onClick={() => fetchTransactions()}>Refresh</Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="active">Active Borrows</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Books</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-background">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const book = getBookDetails(transaction);
              const isOverdue = transaction.status === 'overdue';
              const isActive = transaction.status === 'borrowed';
              
              return (
                <Card key={transaction._id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="space-y-4 flex-grow">
                        <div>
                          <h3 className="text-xl font-semibold">{book.title}</h3>
                          <p className="text-muted-foreground">by {book.author}</p>
                          {typeof transaction.user === 'object' ? (
                            <p className="text-sm mt-1">
                              User: {transaction.user.name} ({transaction.user.email})
                            </p>
                          ) : (
                            <p className="text-sm mt-1">User ID: {transaction.user}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Issue Date</p>
                            <p className="font-medium">{formatDate(transaction.issueDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-medium">{formatDate(transaction.dueDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Return Date</p>
                            <p className="font-medium">
                              {transaction.returnDate ? formatDate(transaction.returnDate) : 'Not returned'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-red-600 mt-1">
                            {calculateDaysOverdue(transaction.dueDate)} days overdue
                            <br />
                            Fine: ${calculateFine(transaction.dueDate)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        {isActive && (
                          <Button 
                            variant="outline"
                            onClick={() => handleManualReturn(transaction)}
                          >
                            Mark as Returned
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPageAdmin; 