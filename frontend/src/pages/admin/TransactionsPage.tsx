import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Transaction, transactionService } from '@/services/transactionService';
import { bookService } from '@/services/bookService';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import settingsService, { BorrowingRules } from '@/services/settingsService';

const TransactionsPageAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [borrowingRules, setBorrowingRules] = useState<BorrowingRules>({
    maxBooksStudent: 3,
    maxBooksTeacher: 5,
    maxDaysStudent: 14,
    maxDaysTeacher: 30,
    finePerDay: 0.5
  });

  const navigate = useNavigate();

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
          
          // Use the getUserName helper to safely get user info
          const userInfo = getUserName(transaction);
          
          return bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                userInfo.toLowerCase().includes(searchTerm.toLowerCase());
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
  
  const handleManualReturn = async (transaction: Transaction) => {
    if (!transaction || !transaction.book) {
      toast({
        title: "Error",
        description: "Invalid transaction. Cannot mark as returned.",
        variant: "destructive",
      });
      return;
    }
    
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
    if (!transaction || !transaction.book) {
      return {
        title: 'Unknown Book',
        author: 'Unknown Author',
        id: 'unknown'
      };
    }
    
    if (typeof transaction.book === 'object') {
      return {
        title: transaction.book.title || 'Untitled Book',
        author: transaction.book.author || 'Unknown Author',
        id: transaction.book._id
      };
    }
    
    return {
      title: 'Unknown Book',
      author: 'Unknown Author',
      id: transaction.book
    };
  };

  // Get user name from transaction
  const getUserName = (transaction: any) => {
    let userName = '';
    
    if (transaction.user && typeof transaction.user === 'object') {
      userName = transaction.user.name || 'Unknown User';
      const userEmail = transaction.user.email || 'No email';
      
      // Return formatted name with email
      return `${userName} (${userEmail})`;
    } else {
      // Handle if user is just an ID or null
      userName = transaction.user ? 'User ID: ' + transaction.user : 'Unknown User';
      return userName;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold">Manage Transactions</h1>
          <p className="text-muted-foreground">
            View and manage borrowing records for all users
          </p>
        </div>
        
        <Button onClick={() => navigate('/admin/transactions/issue')}>Issue New Book</Button>
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
                          <h3 className="text-xl font-semibold">{book?.title || 'Unknown Book'}</h3>
                          <p className="text-muted-foreground">by {book?.author || 'Unknown Author'}</p>
                          {transaction.user && typeof transaction.user === 'object' ? (
                            <p className="text-sm mt-1">
                              User: {getUserName(transaction)}
                            </p>
                          ) : (
                            <p className="text-sm mt-1">User ID: {getUserName(transaction)}</p>
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
                            Fine: ₹{calculateFine(transaction.dueDate)}
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