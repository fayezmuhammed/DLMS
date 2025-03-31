import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import api from '@/utils/api';

interface Category {
  _id: string;
  name: string;
}

interface Book {
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
}

export default function AddBookPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newBook, setNewBook] = useState<Book>({
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

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/categories');
        console.log('Categories response:', response.data);
        if (response.data.success && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
        } else {
          throw new Error('Invalid categories data format');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      }
    }
    
    fetchCategories();
  }, [toast]);

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
    
    // Enhanced validation for required fields
    const validationErrors = [];
    
    if (!newBook.title?.trim()) {
      validationErrors.push('Please add a title');
    }
    if (!newBook.author?.trim()) {
      validationErrors.push('Please add an author');
    }
    
    // Enhanced ISBN validation
    if (!newBook.isbn?.trim()) {
      validationErrors.push('Please add an ISBN');
    } else if (newBook.isbn.trim().length < 10) {
      // Basic ISBN length check (most ISBNs are at least 10 digits)
      validationErrors.push('ISBN seems too short - please enter a valid ISBN');
    }
    
    if (!newBook.category) {
      validationErrors.push('Please select a category');
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
      formData.append('title', newBook.title.trim());
      formData.append('author', newBook.author.trim());
      formData.append('isbn', newBook.isbn.trim());
      formData.append('bookNo', newBook.bookNo.trim());
      formData.append('category', newBook.category);
      formData.append('status', newBook.status);
      formData.append('copies', String(newBook.copies));
      
      // Add optional fields if they have values
      if (newBook.publisher?.trim()) formData.append('publisher', newBook.publisher.trim());
      if (newBook.edition?.trim()) formData.append('edition', newBook.edition.trim());
      if (newBook.description?.trim()) formData.append('description', newBook.description.trim());
      if (newBook.tags?.trim()) formData.append('tags', newBook.tags.trim());
      
      // Add image if selected
      if (coverImageFile) {
        formData.append('image', coverImageFile);
      }

      // Log the form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await api.post('/books/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && response.data.success) {
        toast({
          title: "Success",
          description: "Book added successfully",
        });
        navigate('/admin/books');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error adding book:', error);
      const errorMessage = error.response?.data?.message || "Failed to add book";
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
        <h1 className="text-2xl font-bold tracking-tight">Add New Book</h1>
        <Button variant="outline" onClick={() => navigate('/admin/books')}>
          Back to Books
        </Button>
      </div>

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
                value={newBook.bookNo} 
                onChange={(e) => setNewBook({...newBook, bookNo: e.target.value})}
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
                value={newBook.title} 
                onChange={(e) => setNewBook({...newBook, title: e.target.value})}
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
                value={newBook.author} 
                onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn">
                ISBN <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="isbn" 
                value={newBook.isbn} 
                onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                placeholder="Enter unique ISBN number (e.g., 9781234567890)"
                required
              />
              <p className="text-xs text-gray-500">ISBN must be unique for each book. Standard formats are ISBN-10 or ISBN-13.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={newBook.category}
                onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Optional Fields</h2>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={newBook.status}
                onChange={(e) => setNewBook({...newBook, status: e.target.value as Book['status']})}
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
                value={newBook.copies} 
                onChange={(e) => setNewBook({...newBook, copies: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input 
                id="publisher" 
                value={newBook.publisher} 
                onChange={(e) => setNewBook({...newBook, publisher: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edition">Edition</Label>
              <Input 
                id="edition" 
                value={newBook.edition} 
                onChange={(e) => setNewBook({...newBook, edition: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={newBook.description} 
                onChange={(e) => setNewBook({...newBook, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input 
                id="tags" 
                value={newBook.tags} 
                onChange={(e) => setNewBook({...newBook, tags: e.target.value})}
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
            {loading ? 'Adding...' : 'Add Book'}
          </Button>
        </div>
      </form>
    </div>
  );
}