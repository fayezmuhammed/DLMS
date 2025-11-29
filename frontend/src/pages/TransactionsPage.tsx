import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Transaction, transactionService } from '@/services/transactionService';
import { toast } from '@/components/ui/use-toast';
import settingsService, { BorrowingRules } from '@/services/settingsService';
import { AlertCircle, BookCopy, Check, IndianRupee, RefreshCw, Undo2 } from 'lucide-react';

const TransactionsPage: React.FC = () => {
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [borrowingRules, setBorrowingRules] = useState<BorrowingRules>({
    maxBooksStudent: 3,
    maxBooksTeacher: 5,
    maxDaysStudent: 14,
    maxDaysTeacher: 30,
    finePerDay: 0.5
  });
  const [userRole, setUserRole] = useState<string>('student');
  const [returningId, setReturningId] = useState<string | null>(null);
  const [borrowingId, setBorrowingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchBorrowingRules();
    setUserRoleFromStorage();
  }, []);

  const setUserRoleFromStorage = () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUserRole(user.role.toLowerCase());
      }
    } catch (err) {
      console.error('Error setting user role from storage:', err);
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
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getBorrowingHistory();
      
      if (response.success && response.data) {
        // Filter current (borrowed) and past (returned) transactions
        const current = response.data.filter(
          (transaction: Transaction) => transaction.status === 'borrowed' || transaction.status === 'overdue'
        );
        const history = response.data.filter(
          (transaction: Transaction) => transaction.status === 'returned'
        );
        
        setCurrentTransactions(current);
        setTransactionHistory(history);
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

  const handleBorrowAgain = async (bookId: string) => {
    if (!bookId) {
      toast({
        title: "Error",
        description: "Invalid book ID. Cannot borrow book.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setBorrowingId(bookId);
      const response = await transactionService.borrowBook(bookId);
      
      if (response.success) {
        toast({
          title: "Book borrowed successfully",
          description: "You've successfully borrowed this book again.",
        });
        // Refresh the transactions list
        fetchTransactions();
      } else {
        toast({
          title: "Failed to borrow book",
          description: response.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error borrowing book:', err);
      toast({
        title: "Error",
        description: "Failed to borrow the book. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setBorrowingId(null);
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

  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDaysOverdue = (dueDate: string) => {
    return transactionService.calculateOverdueDays(dueDate);
  };

  const calculateFine = (dueDate: string) => {
    const { fineAmount } = transactionService.calculateFine(dueDate, borrowingRules);
    return fineAmount;
  };

  const handlePayFine = (_transactionId: string, amount: number) => {
    toast({
      title: "Payment Processing",
      description: `Processing payment of ₹${amount.toFixed(2)} for overdue fees.`,
    });
    
    // In a real implementation, this would redirect to a payment gateway
    // For now, we'll simulate a successful payment
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: "Your payment was processed successfully. You can now return the book.",
      });
    }, 1500);
  };

  // Helper function to get book details from transaction
  const getBookDetails = (transaction: Transaction) => {
    if (!transaction || !transaction.book) {
      return {
        title: 'Unknown Book',
        author: 'Unknown Author',
        coverImage: 'https://placehold.co/400x600?text=No+Cover',
        id: 'unknown'
      };
    }
    
    if (typeof transaction.book === 'object') {
      return {
        title: transaction.book.title || 'Untitled Book',
        author: transaction.book.author || 'Unknown Author',
        coverImage: transaction.book.coverImage || transaction.book.imagePath || 'https://placehold.co/400x600?text=No+Cover',
        id: transaction.book._id
      };
    }
    
    return {
      title: 'Unknown Book',
      author: 'Unknown Author',
      coverImage: 'https://placehold.co/400x600?text=No+Cover',
      id: transaction.book as string
    };
  };

  // Handle returning a book
  const handleReturnBook = async (transactionId: string) => {
    try {
      setReturningId(transactionId);
      
      const response = await transactionService.returnBook(transactionId, true);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Book has been returned successfully.",
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
    } catch (err: any) {
      console.error('Error returning book:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to return book. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setReturningId(null);
    }
  };

  // Add the borrowing rules info component
  const BorrowingRulesInfo = () => {
    const maxBooks = userRole === 'teacher' ? borrowingRules.maxBooksTeacher : borrowingRules.maxBooksStudent;
    const maxDays = userRole === 'teacher' ? borrowingRules.maxDaysTeacher : borrowingRules.maxDaysStudent;
    
    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Your Borrowing Limits</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Maximum Books</p>
            <p className="font-medium">{maxBooks}</p>
          </div>
          <div>
            <p className="text-gray-600">Loan Period</p>
            <p className="font-medium">{maxDays} days</p>
          </div>
          <div>
            <p className="text-gray-600">Late Fee</p>
            <p className="font-medium">₹{borrowingRules.finePerDay} / day</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading your transactions...</div>;
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Borrowing History</h1>
        <Button onClick={fetchTransactions} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <BorrowingRulesInfo />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start mb-6">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading transactions</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Borrows ({currentTransactions.length})</TabsTrigger>
          <TabsTrigger value="history">Borrowing History ({transactionHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {currentTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BookCopy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Borrows</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any books checked out at the moment.
                </p>
                <Button asChild>
                  <a href="/books">Browse Books</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Currently Borrowed Books</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Borrowed On</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time Remaining</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction) => {
                      const book = getBookDetails(transaction);
                      const isOverdue = transaction.status === 'overdue';
                      const daysLeft = calculateDaysLeft(transaction.dueDate);
                      const daysOverdue = calculateDaysOverdue(transaction.dueDate);
                      const fine = calculateFine(transaction.dueDate);
                      
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{book.title}</div>
                              <div className="text-xs text-muted-foreground">{book.author}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(transaction.issueDate)}</TableCell>
                          <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <div className="flex items-center text-red-600">
                                <span>{daysOverdue} days overdue</span>
                                <div className="ml-2 text-xs">
                                  <IndianRupee className="inline h-3 w-3 mr-1" />
                                  <span>{fine}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-amber-600">{daysLeft} days left</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline"
                              size="sm"
                              disabled={returningId === transaction._id}
                              onClick={() => handleReturnBook(transaction._id)}
                              className="mr-2"
                            >
                              {returningId === transaction._id ? (
                                'Processing...'
                              ) : (
                                <>
                                  <Check className="mr-1 h-4 w-4" />
                                  Return
                                </>
                              )}
                            </Button>
                            {isOverdue && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePayFine(transaction._id, fine)}
                              >
                                <IndianRupee className="mr-1 h-4 w-4" />
                                Pay Fine
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {transactionHistory.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BookCopy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Borrowing History</h3>
                <p className="text-muted-foreground">
                  You haven't borrowed any books yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Previously Borrowed Books</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Borrowed On</TableHead>
                      <TableHead>Returned On</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionHistory.map((transaction) => {
                      const book = getBookDetails(transaction);
                      
                      // Calculate borrowing duration in days
                      const issueDate = new Date(transaction.issueDate);
                      const returnDate = new Date(transaction.returnDate || transaction.dueDate);
                      const durationMs = returnDate.getTime() - issueDate.getTime();
                      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
                      
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{book.title}</div>
                              <div className="text-xs text-muted-foreground">{book.author}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(transaction.issueDate)}</TableCell>
                          <TableCell>{formatDate(transaction.returnDate || '')}</TableCell>
                          <TableCell>{durationDays} days</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={borrowingId === book.id}
                              onClick={() => handleBorrowAgain(book.id)}
                            >
                              {borrowingId === book.id ? (
                                'Processing...'
                              ) : (
                                <>
                                  <Undo2 className="mr-1 h-4 w-4" />
                                  Borrow Again
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage; 