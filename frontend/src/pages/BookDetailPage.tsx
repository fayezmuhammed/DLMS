import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Book, bookService } from '@/services/bookService';
import { transactionService } from '@/services/transactionService';
import api from '@/utils/api';

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
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [borrowing, setBorrowing] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch book data
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        if (!id) return;
        
        // Use bookService to fetch book details
        const response = await api.get(`/books/${id}`);
        if (response.data && response.data.book) {
          setBook(response.data.book);
          
          // Fetch related books
          const booksResponse = await bookService.getBooks();
          const allBooks = booksResponse.data || [];
          
          // Filter related books by category
          if (response.data.book && response.data.book.category) {
            const categoryId = typeof response.data.book.category === 'object' 
              ? response.data.book.category._id 
              : response.data.book.category;
              
            const related = allBooks
              .filter((b: Book) => {
                if (!b.category) return false;
                
                const bookCategoryId = typeof b.category === 'object' 
                  ? b.category._id 
                  : b.category;
                  
                return b._id !== response.data.book._id && 
                       bookCategoryId === categoryId;
              })
              .slice(0, 3);
            
            setRelatedBooks(related);
          }
        } else {
          setError('Book not found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book details');
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  const handleBorrowBook = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to borrow books",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!book) return;

    try {
      setBorrowing(true);
      
      const response = await transactionService.borrowBook(book._id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Book borrowed successfully.",
        });
        // Refresh book data to update status
        if (id) {
          const updatedBookResponse = await api.get(`/books/${id}`);
          setBook(updatedBookResponse.data.book);
        }
        
        // Redirect to transactions page
        navigate('/transactions');
      } else {
        toast({
          title: "Borrowing failed",
          description: response.message || "Failed to borrow book",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error borrowing book:', err);
      toast({
        title: "Borrowing failed",
        description: err.response?.data?.message || "Failed to borrow book. The book may not be available.",
        variant: "destructive"
      });
    } finally {
      setBorrowing(false);
    }
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add books to your wishlist",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    setAddingToWishlist(true);
    
    // Simulate adding to wishlist (implement actual API call when backend supports it)
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Book added to your wishlist",
      });
      setAddingToWishlist(false);
    }, 1000);
  };

  if (loading) {
    return <div className="text-center py-12">Loading book details...</div>;
  }

  if (error || !book) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The book you're looking for doesn't exist or has been removed."}</p>
        <Button asChild>
          <Link to="/books">Back to Books</Link>
        </Button>
      </div>
    );
  }

  const isAvailable = book.status === 'Available';

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/books">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Books
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Book Cover */}
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden border border-border">
            <img 
              src={book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
              alt={book.title} 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="mt-4 space-y-3">
            {user && (
              <>
                <Button 
                  className="w-full" 
                  disabled={!isAvailable || borrowing}
                  onClick={handleBorrowBook}
                >
                  {borrowing ? 'Processing...' : isAvailable ? 'Borrow Book' : 'Currently Unavailable'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={addingToWishlist}
                  onClick={handleAddToWishlist}
                >
                  {addingToWishlist ? 'Adding...' : 'Add to Wishlist'}
                </Button>
              </>
            )}
            {!user && (
              <Button className="w-full" onClick={() => navigate('/login')}>
                Login to Borrow
              </Button>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-xl text-muted-foreground">by {book.author}</p>
            <div className="flex items-center mt-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                book.status === 'Available' 
                  ? 'bg-green-100 text-green-800' 
                  : book.status === 'Reserved' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {book.status}
              </span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p>{book.description || 'No description available.'}</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Book Details</h3>
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Category:</div>
                  <div>
                    {typeof book.category === 'object' && book.category?.name ? book.category.name : 'Unknown'}
                  </div>
                  <div className="font-medium">ISBN:</div>
                  <div>{book.ISBN}</div>
                  <div className="font-medium">Status:</div>
                  <div>{book.status}</div>
                  <div className="font-medium">Copies Available:</div>
                  <div>{book.copies}</div>
                  {book.publisher && (
                    <>
                      <div className="font-medium">Publisher:</div>
                      <div>{book.publisher}</div>
                    </>
                  )}
                  {book.edition && (
                    <>
                      <div className="font-medium">Edition:</div>
                      <div>{book.edition}</div>
                    </>
                  )}
                  {/* Use optional chaining for properties that might not exist */}
                  {book.shelf && (
                    <>
                      <div className="font-medium">Shelf Location:</div>
                      <div>{book.shelf}</div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {relatedBooks.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Related Books</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedBooks.map(relatedBook => (
                  <Card key={relatedBook._id} className="overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={relatedBook.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                        alt={relatedBook.title} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium line-clamp-1">{relatedBook.title}</h4>
                      <p className="text-sm text-muted-foreground">by {relatedBook.author}</p>
                      <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                        <Link to={`/books/${relatedBook._id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage; 