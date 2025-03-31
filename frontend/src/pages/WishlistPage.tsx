import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash2, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { WishlistItem, wishlistService } from '@/services/wishlistService';
import { toast } from '@/components/ui/use-toast';
import { transactionService } from '@/services/transactionService';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [borrowing, setBorrowing] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getWishlist();
      if (response.success) {
        setWishlist(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch wishlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wishlist. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWishlist = wishlist.filter(item =>
    item.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeFromWishlist = async (bookId: string) => {
    try {
      const response = await wishlistService.removeFromWishlist(bookId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Book removed from wishlist",
        });
        fetchWishlist(); // Refresh the wishlist
      } else {
        toast({
          title: "Error",
          description: "Failed to remove book from wishlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove book from wishlist. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleBorrowBook = async (bookId: string) => {
    try {
      setBorrowing(prev => ({ ...prev, [bookId]: true }));
      const response = await transactionService.borrowBook(bookId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Book borrowed successfully.",
        });
        fetchWishlist(); // Refresh the wishlist to update book status
        navigate('/transactions');
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to borrow book",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      toast({
        title: "Error",
        description: "Failed to borrow book. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setBorrowing(prev => ({ ...prev, [bookId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground mt-2">
              Keep track of books you want to read
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="text-red-500" />
            <span className="text-lg font-medium">{wishlist.length} Books</span>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex items-center space-x-4">
          <Input
            type="search"
            placeholder="Search your wishlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Wishlist Grid */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading your wishlist...</p>
            </div>
          ) : filteredWishlist.length > 0 ? (
            filteredWishlist.map((item) => (
              <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Book Cover */}
                    <div className="w-32 h-48 flex-shrink-0">
                      <img
                        src={item.book.coverImage || item.book.imagePath || 'https://placehold.co/320x480?text=No+Cover'}
                        alt={item.book.title}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/320x480?text=No+Cover';
                        }}
                      />
                    </div>

                    {/* Book Details */}
                    <div className="flex-grow space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{item.book.title}</h3>
                        <p className="text-muted-foreground">by {item.book.author}</p>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Added On</p>
                          <p className="font-medium">{formatDate(item.addedDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge className={
                            item.book.status === 'Available' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {item.book.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4">
                        {item.book.status === 'Available' && (
                          <Button 
                            className="flex items-center space-x-2"
                            onClick={() => handleBorrowBook(item.book._id)}
                            disabled={borrowing[item.book._id]}
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>{borrowing[item.book._id] ? 'Processing...' : 'Borrow Now'}</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFromWishlist(item.book._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-4">
                Start adding books you want to read in the future
              </p>
              <Button asChild>
                <Link to="/books">Browse Books</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage; 