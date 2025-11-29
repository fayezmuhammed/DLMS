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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Transaction, transactionService } from '@/services/transactionService';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import settingsService, { BorrowingRules } from '@/services/settingsService';
import AdminPageTitle from '@/components/admin/AdminPageTitle';
import { AlertCircle, BookCopy, Check, IndianRupee, RefreshCw } from 'lucide-react';

const TransactionsPageAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [returningId, setReturningId] = useState<string | null>(null);
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
    if (!transaction || !transaction._id) {
      toast({
        title: "Error",
        description: "Invalid transaction. Cannot mark as returned.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setReturningId(transaction._id);
      // Use transaction ID instead of book ID, and set isTransactionId to true
      const response = await transactionService.returnBook(transaction._id, true);
      
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
    } finally {
      setReturningId(null);
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
    if (transaction.user && typeof transaction.user === 'object') {
      return transaction.user.name || 'Unknown User';
    }
    
    return transaction.user ? 'User ID: ' + transaction.user : 'Unknown User';
  };

  // Get user email from transaction
  const getUserEmail = (transaction: any) => {
    if (transaction.user && typeof transaction.user === 'object') {
      return transaction.user.email || 'No email';
    }
    
    return '';
  };

  if (loading && !filteredTransactions.length) {
    return <div className="text-center py-12">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      <AdminPageTitle 
        title="Manage Transactions" 
        description="View and manage borrowing records for all users"
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button onClick={fetchTransactions} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="active">Active Borrows</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Books</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error loading transactions</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BookCopy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground">
                  There are currently no borrowing records matching your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Borrowing Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const book = getBookDetails(transaction);
                      const isOverdue = transaction.status === 'overdue';
                      const isActive = transaction.status === 'borrowed';
                      
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getUserName(transaction)}</div>
                              <div className="text-xs text-muted-foreground">{getUserEmail(transaction)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{book.title}</div>
                              <div className="text-xs text-muted-foreground">{book.author}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(transaction.issueDate)}</TableCell>
                          <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                          <TableCell>
                            {transaction.returnDate ? formatDate(transaction.returnDate) : 'Not returned'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <div className="flex items-center text-red-600">
                                <IndianRupee className="h-3 w-3 mr-1" />
                                <span>{calculateFine(transaction.dueDate)}</span>
                                <span className="ml-1 text-xs">({calculateDaysOverdue(transaction.dueDate)} days)</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {(isActive || isOverdue) && (
                              <Button 
                                variant="outline"
                                size="sm"
                                disabled={returningId === transaction._id}
                                onClick={() => handleManualReturn(transaction)}
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
                            )}
                            {transaction.status === 'returned' && (
                              <span className="text-green-600 flex items-center justify-end">
                                <Check className="mr-1 h-4 w-4" />
                                Returned
                              </span>
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
      </Tabs>
    </div>
  );
};

export default TransactionsPageAdmin; 