import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EBook, ebookService } from '@/services/ebookService';
import { Category, bookService } from '@/services/bookService';

const EBooksPage: React.FC = () => {
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');

  // Fetch e-books and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch e-books
        const ebooksResponse = await ebookService.getEBooks();
        setEbooks(ebooksResponse.data || []);
        
        // Fetch categories
        const categoriesResponse = await bookService.getCategories();
        setCategories(categoriesResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load e-books. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter e-books based on search term, category, and accessibility
  const filteredEbooks = ebooks.filter(ebook => {
    const matchesSearch = 
      ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ebook.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ebook.description && ebook.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Handle category being either a string, object, or null
    let ebookCategoryId = null;
    if (ebook.category) {
      ebookCategoryId = typeof ebook.category === 'object' ? ebook.category._id : ebook.category;
    }
    const matchesCategory = selectedCategory === 'all' || ebookCategoryId === selectedCategory;
    
    const matchesAccess = accessFilter === 'all' || 
      (accessFilter === 'public' && ebook.accessRestriction === 'Public') ||
      (accessFilter === 'members' && ebook.accessRestriction === 'Members') ||
      (accessFilter === 'premium' && ebook.accessRestriction === 'Premium');
    
    return matchesSearch && matchesCategory && matchesAccess;
  });

  // Function to format file size in a readable format
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    
    const KB = 1024;
    const MB = KB * 1024;
    
    if (bytes < KB) {
      return `${bytes} bytes`;
    } else if (bytes < MB) {
      return `${(bytes / KB).toFixed(1)} KB`;
    } else {
      return `${(bytes / MB).toFixed(1)} MB`;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading e-books...</div>;
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
        <h1 className="text-3xl font-bold mb-2">Digital Library</h1>
        <p className="text-muted-foreground">Browse our collection of e-books available for reading and download</p>
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
                {selectedCategory === 'all' ? 'All Categories' : 
                  categories.find(c => c._id === selectedCategory)?.name || 'Select category'}
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
          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by accessibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Access Levels</SelectItem>
              <SelectItem value="public">Public Access</SelectItem>
              <SelectItem value="members">Members Only</SelectItem>
              <SelectItem value="premium">Premium Access</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* E-Books Grid */}
      {filteredEbooks.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No E-Books Found</h2>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setAccessFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEbooks.map(ebook => (
            <Card key={ebook._id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="aspect-[3/4] relative">
                <img 
                  src={ebook.coverImage || ebook.image || ebook.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                  alt={ebook.title} 
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ebook.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {ebook.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ebook.accessRestriction === 'Public' 
                      ? 'bg-blue-100 text-blue-800' 
                      : ebook.accessRestriction === 'Members'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ebook.accessRestriction}
                  </span>
                </div>
              </div>
              <CardContent className="p-4 flex-grow flex flex-col">
                <div className="mb-2 text-xs text-slate-500 uppercase tracking-wider">
                  {ebook.fileType.toUpperCase()} • {formatFileSize(ebook.fileSize)}
                  {ebook.category && (
                    <> • {typeof ebook.category === 'object' ? ebook.category.name : 
                      categories.find(c => c._id === ebook.category)?.name || 'Uncategorized'}</>
                  )}
                </div>
                <h3 className="font-semibold line-clamp-1 mb-1">{ebook.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">by {ebook.author}</p>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {ebook.description || 'No description available.'}
                </p>
                <div className="mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      navigate(`/ebooks/${ebook._id}`);
                    }}
                  >
                    View Details
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

export default EBooksPage; 