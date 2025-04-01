import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import api from '@/utils/api';
import { bookService } from '@/services/bookService';

interface Category {
  _id: string;
  name: string;
}

interface Book {
  _id?: string;
  title: string;
  author: string;
  isbn: string;
  bookNo: string;
  category: string;
  status: 'Available' | 'Reserved' | 'Issued' | 'Lost';
  copies: number;
  publisher: string;
  edition: string;
  description: string;
  tags: string;
  coverImage?: string;
  image?: string;
  imagePublicId?: string;
  imagePath?: string;
}

export default function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [book, setBook] = useState<Book>({
    title: '',
    author: '',
    isbn: '',
    bookNo: '',
    category: '',
    status: 'Available',
    copies: 1,
    publisher: '',
    edition: '',
    description: '',
    tags: ''
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');

  // Fetch book data and categories on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse.data.success && Array.isArray(categoriesResponse.data.data)) {
          setCategories(categoriesResponse.data.data);
        }
        
        // Fetch book details
        if (id) {
          const bookResponse = await bookService.getBookById(id);
          if (bookResponse && bookResponse.book) {
            const bookData = bookResponse.book;
            setBook({
              _id: bookData._id,
              title: bookData.title || '',
              author: bookData.author || '',
              isbn: bookData.ISBN || bookData.isbn || '',
              bookNo: bookData.bookNo || '',
              category: typeof bookData.category === 'object' 
                ? (bookData.category?._id || '') 
                : (bookData.category || ''),
              status: bookData.status || 'Available',
              copies: bookData.copies || 1,
              publisher: bookData.publisher || '',
              edition: bookData.edition || '',
              description: bookData.description || '',
              tags: bookData.tags || '',
              coverImage: bookData.coverImage || bookData.image || ''
            });
            
            // Set image preview if available
            if (bookData.coverImage || bookData.image) {
              setCoverImagePreview(bookData.coverImage || bookData.image || '');
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch book details",
              variant: "destructive",
            });
            navigate('/admin/books');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        });
        navigate('/admin/books');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id, toast, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && typeof event.target.result === 'string') {
          setCoverImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation for required fields
    const validationErrors = [];
    
    if (!book.title?.trim()) {
      validationErrors.push('Please add a title');
    }
    if (!book.author?.trim()) {
      validationErrors.push('Please add an author');
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Add all book data to formData with proper type conversion
      formData.append('title', book.title.trim());
      formData.append('author', book.author.trim());
      formData.append('bookNo', book.bookNo.trim());
      formData.append('status', book.status);
      formData.append('copies', String(book.copies));
      
      // Add optional fields if they have values
      if (book.isbn?.trim()) formData.append('isbn', book.isbn.trim());
      if (book.category?.trim()) formData.append('category', book.category);
      if (book.publisher?.trim()) formData.append('publisher', book.publisher.trim());
      if (book.edition?.trim()) formData.append('edition', book.edition.trim());
      if (book.description?.trim()) formData.append('description', book.description.trim());
      if (book.tags?.trim()) formData.append('tags', book.tags.trim());
      
      // Add image if selected
      if (coverImageFile) {
        formData.append('image', coverImageFile);
      }

      // Update book if id is available
      if (id) {
        const response = await bookService.updateBook(id, formData);
        
        if (response && response.success) {
          toast({
            title: "Success",
            description: "Book updated successfully",
          });
          navigate('/admin/books');
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        throw new Error('Book ID not available');
      }
    } catch (error: any) {
      console.error('Error updating book:', error);
      const errorMessage = error.response?.data?.message || "Failed to update book";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get category name from ID
  const getCategoryNameById = (categoryId: string): string => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Book</h1>
        <Button variant="outline" onClick={() => navigate('/admin/books')}>
          Back to Books
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <p>Loading book details...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Fields */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Required Fields</h2>
              
              <div className="space-y-2">
                <Label htmlFor="bookNo">
                  Book Number <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="bookNo" 
                  value={book.bookNo} 
                  onChange={(e) => setBook({...book, bookNo: e.target.value})}
                  placeholder="Enter unique book number"
                  required
                />
                <p className="text-xs text-gray-500">Book number must be unique for each book.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="title" 
                  value={book.title} 
                  onChange={(e) => setBook({...book, title: e.target.value})}
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">
                  Author <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="author" 
                  value={book.author} 
                  onChange={(e) => setBook({...book, author: e.target.value})}
                  placeholder="Enter author name"
                  required
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Optional Fields</h2>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input 
                  id="isbn" 
                  value={book.isbn} 
                  onChange={(e) => setBook({...book, isbn: e.target.value})}
                  placeholder="Enter ISBN number (e.g., 9781234567890)"
                />
                <p className="text-xs text-gray-500">Standard formats are ISBN-10 or ISBN-13.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={book.category}
                  onChange={(e) => setBook({...book, category: e.target.value})}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={book.status}
                  onChange={(e) => setBook({...book, status: e.target.value as Book['status']})}
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Issued">Issued</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="copies">Copies</Label>
                <Input 
                  id="copies" 
                  type="number"
                  min="1"
                  value={book.copies} 
                  onChange={(e) => setBook({...book, copies: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input 
                  id="publisher" 
                  value={book.publisher} 
                  onChange={(e) => setBook({...book, publisher: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edition">Edition</Label>
                <Input 
                  id="edition" 
                  value={book.edition} 
                  onChange={(e) => setBook({...book, edition: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={book.description} 
                  onChange={(e) => setBook({...book, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input 
                  id="tags" 
                  value={book.tags} 
                  onChange={(e) => setBook({...book, tags: e.target.value})}
                  placeholder="Comma-separated tags"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image</Label>
                <Input 
                  id="coverImage" 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {coverImagePreview && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-500 mb-1">Preview:</div>
                    <div className="relative w-28 h-40 overflow-hidden rounded-md border border-gray-200">
                      <img 
                        src={coverImagePreview} 
                        alt="Cover preview" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/books')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 