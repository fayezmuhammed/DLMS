import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Transaction, transactionService } from '@/services/transactionService';
import { toast } from '@/components/ui/use-toast';
import { Book } from '@/services/bookService';
import settingsService, { BorrowingRules } from '@/services/settingsService';

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

  const handlePayFine = (transactionId: string, amount: number) => {
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
        variant: "success",
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
        description: err.response?.data?.message || "Failed to return the book. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setReturningId(null);
    }
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Transactions</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your book borrowing history
        </p>
      </div>

      <BorrowingRulesInfo />

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Borrows</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {currentTransactions.length > 0 ? (
            currentTransactions.map((transaction) => {
              const book = getBookDetails(transaction);
              return (
                <Card key={transaction._id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex-grow space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{book?.title || 'Unknown Book'}</h3>
                        <p className="text-muted-foreground">by {book?.author || 'Unknown Author'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Borrow Date</p>
                          <p className="font-medium">{formatDate(transaction.issueDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Due Date</p>
                          <p className="font-medium">{formatDate(transaction.dueDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                        {transaction.status === 'borrowed' && (
                          <div className="text-sm">
                            {calculateDaysLeft(transaction.dueDate)} days remaining
                          </div>
                        )}
                        {transaction.status === 'overdue' && (
                          <div className="text-sm text-red-600">
                            {calculateDaysOverdue(transaction.dueDate)} days overdue
                            <span className="block font-medium">Fine: ₹{calculateFine(transaction.dueDate).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {transaction.status === 'overdue' && (
                            <>
                              <Button 
                                variant="secondary"
                                className="bg-blue-100 hover:bg-blue-200 text-blue-800"
                                onClick={() => handlePayFine(transaction._id, calculateFine(transaction.dueDate))}
                              >
                                Pay Fine
                              </Button>
                              <Button 
                                variant="outline"
                                disabled={returningId === transaction._id}
                                onClick={() => handleReturnBook(transaction._id)}
                              >
                                {returningId === transaction._id ? 'Processing...' : 'Mark as Returned'}
                              </Button>
                            </>
                          )}
                          {transaction.status === 'borrowed' && (
                            <Button 
                              variant="outline"
                              disabled={returningId === transaction._id}
                              onClick={() => handleReturnBook(transaction._id)}
                            >
                              {returningId === transaction._id ? 'Processing...' : 'Mark as Returned'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No current borrows</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {transactionHistory.length > 0 ? (
            transactionHistory.map((transaction) => {
              const book = getBookDetails(transaction);
              return (
                <Card key={transaction._id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex-grow space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{book?.title || 'Unknown Book'}</h3>
                        <p className="text-muted-foreground">by {book?.author || 'Unknown Author'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Borrow Date</p>
                          <p className="font-medium">{formatDate(transaction.issueDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Return Date</p>
                          <p className="font-medium">{transaction.returnDate ? formatDate(transaction.returnDate) : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                        <Button 
                          variant="outline"
                          onClick={() => handleBorrowAgain(typeof transaction.book === 'object' ? transaction.book._id : transaction.book)}
                        >
                          Borrow Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transaction history</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage; 