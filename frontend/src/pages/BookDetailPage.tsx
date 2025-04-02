import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Book, bookService } from '@/services/bookService';
import { transactionService } from '@/services/transactionService';
import { WishlistItem, wishlistService } from '@/services/wishlistService';

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
        const response = await bookService.getBookById(id);
        if (response && response.book) {
          setBook(response.book);
          
          // Fetch related books
          const booksResponse = await bookService.getBooks();
          const allBooks = booksResponse.books || [];
          
          // Filter related books by category
          if (response.book.category) {
            const categoryId = typeof response.book.category === 'object' 
              ? response.book.category._id 
              : response.book.category;
              
            const related = allBooks
              .filter((b: Book) => {
                if (!b.category) return false;
                
                const bookCategoryId = typeof b.category === 'object' 
                  ? b.category._id 
                  : b.category;
                  
                return b._id !== response.book._id && 
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
          const updatedBookResponse = await bookService.getBookById(id);
          if (updatedBookResponse && updatedBookResponse.book) {
            setBook(updatedBookResponse.book);
          }
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

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add books to your wishlist",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!book) return;

    setAddingToWishlist(true);
    
    try {
      const response = await wishlistService.addToWishlist(book._id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Book added to your wishlist",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add book to wishlist",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error adding to wishlist:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to add book to wishlist. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setAddingToWishlist(false);
    }
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
              src={book.coverImage || book.image || book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
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

          {/* Book Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ISBN</p>
              <p className="font-medium">{book.ISBN}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Publisher</p>
              <p className="font-medium">{book.publisher || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Edition</p>
              <p className="font-medium">{book.edition || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">
                {typeof book.category === 'object' ? book.category.name : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shelf</p>
              <p className="font-medium">{book.shelf || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Copies</p>
              <p className="font-medium">{book.copies}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">
              {book.description || 'No description available.'}
            </p>
          </div>

          {/* Tags */}
          {book.tags && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {book.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Books */}
          {relatedBooks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Related Books</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {relatedBooks.map((relatedBook) => (
                  <Card key={relatedBook._id} className="overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      <img
                        src={relatedBook.imagePath || 'https://placehold.co/400x600?text=No+Cover'}
                        alt={relatedBook.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          relatedBook.status === 'Available'
                            ? 'bg-green-100 text-green-800'
                            : relatedBook.status === 'Reserved'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {relatedBook.status}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1 mb-1">{relatedBook.title}</h3>
                      <p className="text-sm text-muted-foreground">by {relatedBook.author}</p>
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <Link to={`/books/${relatedBook._id}`}>View Details</Link>
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