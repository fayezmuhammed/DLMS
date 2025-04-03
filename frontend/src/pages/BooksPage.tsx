import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, Category, bookService } from '@/services/bookService';

// Interface for Book type is now imported from bookService
// Interface for Category type is now imported from bookService

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Fetch books and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch books
        const booksResponse = await bookService.getBooks();
        setBooks(booksResponse.data || []);
        
        // Fetch categories
        const categoriesResponse = await bookService.getCategories();
        setCategories(categoriesResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load books. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get category name from ID
  const getCategoryName = (categoryId: string): string => {
    if (categoryId === 'all') {
      return 'All Categories';
    }
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Filter books based on search term, category, and availability
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Handle category being either a string, object, or null
    let bookCategoryId = null;
    if (book.category) {
      bookCategoryId = typeof book.category === 'object' ? book.category._id : book.category;
    }
    const matchesCategory = selectedCategory === 'all' || bookCategoryId === selectedCategory;
    
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && book.status === 'Available') ||
      (availabilityFilter === 'borrowed' && book.status !== 'Available');
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (loading) {
    return <div className="text-center py-12">Loading books...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Library Books</h1>
        <p className="text-muted-foreground">Browse our collection of books available for borrowing</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <Input
            placeholder="Search by title, author, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category">
                {getCategoryName(selectedCategory)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="available">Available Only</SelectItem>
              <SelectItem value="borrowed">Borrowed/Reserved Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Books Found</h2>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setAvailabilityFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <Card key={book._id} className="overflow-hidden flex flex-col h-full">
              <div className="aspect-[3/4] relative">
                <img 
                  src={book.coverImage || book.image || book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                  alt={book.title} 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
              <CardContent className="p-4 flex-grow flex flex-col">
                <h3 className="font-semibold line-clamp-1 mb-1">{book.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {book.description || 'No description available.'}
                </p>
                <div className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/books/${book._id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksPage; 