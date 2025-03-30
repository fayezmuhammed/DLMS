import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock wishlist data
const mockWishlist = [
  {
    id: 1,
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
    availability: 'Available',
    addedDate: '2024-02-15',
    genre: 'Classic Literature',
  },
  {
    id: 2,
    title: 'Dune',
    author: 'Frank Herbert',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
    availability: 'Borrowed',
    addedDate: '2024-02-20',
    genre: 'Science Fiction',
  },
  {
    id: 3,
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg',
    availability: 'Available',
    addedDate: '2024-03-01',
    genre: 'Fantasy',
  },
];

const WishlistPage: React.FC = () => {
  const [wishlist, setWishlist] = useState(mockWishlist);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWishlist = wishlist.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeFromWishlist = (id: number) => {
    setWishlist(wishlist.filter(book => book.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'borrowed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          {filteredWishlist.map((book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Book Cover */}
                  <div className="w-32 h-48 flex-shrink-0">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>

                  {/* Book Details */}
                  <div className="flex-grow space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{book.title}</h3>
                      <p className="text-muted-foreground">by {book.author}</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Genre</p>
                        <p className="font-medium">{book.genre}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Added On</p>
                        <p className="font-medium">{formatDate(book.addedDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getAvailabilityColor(book.availability)}>
                          {book.availability}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4">
                      {book.availability === 'Available' && (
                        <Button className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4" />
                          <span>Borrow Now</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeFromWishlist(book.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredWishlist.length === 0 && (
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