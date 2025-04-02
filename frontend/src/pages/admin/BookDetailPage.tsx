import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Book, bookService } from '@/services/bookService';
import { Transaction, transactionService } from '@/services/transactionService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

// Interface for User type
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Fetch book data and transactions
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        if (!id) return;
        
        console.log(`Fetching book with ID: ${id}`);
        
        // Fetch book details
        try {
          const bookResponse = await bookService.getBookById(id);
          console.log('Book response:', bookResponse);
          
          if (bookResponse && bookResponse.success && bookResponse.book) {
            setBook(bookResponse.book);
            console.log('Book set successfully:', bookResponse.book);
          } else {
            console.error('Invalid book response format:', bookResponse);
            setError('Book not found or invalid response format');
            setLoading(false);
            return;
          }
        } catch (bookErr: any) {
          console.error(`Error fetching book: ${bookErr.message}`, bookErr);
          setError(`Book not found: ${bookErr.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }

        // Fetch transactions for this book
        try {
          console.log(`Fetching transactions for book ID: ${id}`);
          const transactionsResponse = await transactionService.getBookTransactions(id);
          console.log('Transactions response:', transactionsResponse);
          
          if (transactionsResponse && transactionsResponse.success) {
            setTransactions(transactionsResponse.data || []);
            console.log('Transactions set successfully:', transactionsResponse.data);
          }
        } catch (txErr) {
          console.error('Error fetching book transactions:', txErr);
          // Don't set error state, just log it, as we still want to show book details
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error(`Error in fetchBookData: ${err.message}`, err);
        setError(`Failed to load book details: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    if (id) {
      fetchBookData();
    }
  }, [id]);

  // Handle status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'Issued':
        return 'bg-blue-100 text-blue-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle transaction status badge color
  const getTransactionStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'borrowed':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The book you're looking for doesn't exist or has been removed."}</p>
        <Button asChild>
          <Link to="/admin/books">Back to Books</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Book Details</h1>
        <Button variant="outline" onClick={() => navigate('/admin/books')}>
          Back to Books
        </Button>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Book Details</TabsTrigger>
          <TabsTrigger value="transactions">
            Transaction History
            {transactions.length > 0 && (
              <Badge className="ml-2 bg-primary text-white">{transactions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Book Cover */}
            <Card className="md:col-span-1">
              <CardContent className="p-6">
                <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                  <img 
                    src={book.coverImage || book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                    alt={book.title} 
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x600?text=No+Cover';
                    }}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(book.status)}`}>
                        {book.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Available Copies</h3>
                    <p className="mt-1 text-lg font-semibold">{book.copies}</p>
                  </div>
                  {book.shelf && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Shelf Location</h3>
                      <p className="mt-1 text-lg font-semibold">{book.shelf}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Added On</h3>
                    <p className="mt-1">{formatDate(book.addedOn)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Details */}
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">{book.title}</h1>
                    <p className="text-xl text-gray-500 mt-1">by {book.author}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">ISBN</h3>
                        <p className="mt-1">{book.ISBN}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Category</h3>
                        <p className="mt-1">
                          {book.category ? 
                            (typeof book.category === 'object' ? book.category.name : book.category) 
                            : 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    
                    {book.publisher && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Publisher</h3>
                        <p className="mt-1">{book.publisher}</p>
                      </div>
                    )}
                    
                    {book.edition && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Edition</h3>
                        <p className="mt-1">{book.edition}</p>
                      </div>
                    )}
                    
                    {book.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1 text-gray-700">{book.description}</p>
                      </div>
                    )}
                    
                    {book.tags && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {book.tags.split(',').map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate(`/admin/books/edit/${book._id}`)}>
              Edit Book
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
                  bookService.deleteBook(book._id)
                    .then(response => {
                      if (response.success) {
                        toast({
                          title: "Success",
                          description: "Book deleted successfully",
                        });
                        navigate('/admin/books');
                      } else {
                        throw new Error(response.message || "Failed to delete book");
                      }
                    })
                    .catch(err => {
                      toast({
                        title: "Error",
                        description: err.message || "Failed to delete book",
                        variant: "destructive",
                      });
                    });
                }
              }}
            >
              Delete Book
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No transaction records found for this book.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      // Get user info
                      const user = transaction.user && typeof transaction.user === 'object' 
                        ? transaction.user 
                        : { name: transaction.user ? `ID: ${transaction.user}` : 'Unknown User' };
                      
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{formatDate(transaction.issueDate)}</TableCell>
                          <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                          <TableCell>
                            {transaction.returnDate ? formatDate(transaction.returnDate) : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionStatusBadgeColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookDetailPage; 