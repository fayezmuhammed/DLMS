import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import api from '@/utils/api';

interface Category {
  _id: string;
  name: string;
}

interface EBook {
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  edition: string;
  description: string;
  status: 'Available' | 'Unavailable';
  accessRestriction: 'Public' | 'Members' | 'Admin';
  downloadable: boolean;
  pages: string;
}

export default function AddEBookPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newEBook, setNewEBook] = useState<EBook>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    edition: '',
    description: '',
    status: 'Available',
    accessRestriction: 'Members',
    downloadable: true,
    pages: ''
  });
  
  // File upload states
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/categories');
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

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleEbookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEbookFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Enhanced validation for required fields
    const validationErrors = [];
    
    if (!newEBook.title?.trim()) {
      validationErrors.push('Please add a title');
    }
    if (!newEBook.author?.trim()) {
      validationErrors.push('Please add an author');
    }
    if (!ebookFile) {
      validationErrors.push('Please upload an e-book file');
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
      
      // Add all e-book data to formData
      Object.entries(newEBook).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });
      
      // Add the e-book file
      if (ebookFile) {
        formData.append('ebook', ebookFile);
      }
      
      // Add cover image if selected
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }

      // Log the form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${typeof value === 'string' ? value : 'File'}`);
      }

      const response = await api.post('/ebooks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && (response.data.success || response.data.data)) {
        toast({
          title: "Success",
          description: "E-book added successfully",
        });
        navigate('/admin/ebooks');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error adding e-book:', error);
      const errorMessage = error.response?.data?.message || "Failed to add e-book";
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
        <h1 className="text-2xl font-bold tracking-tight">Add New E-Book</h1>
        <Button variant="outline" onClick={() => navigate('/admin/ebooks')}>
          Back to E-Books
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="title" 
                value={newEBook.title} 
                onChange={(e) => setNewEBook({...newEBook, title: e.target.value})}
                placeholder="Enter e-book title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">
                Author <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="author" 
                value={newEBook.author} 
                onChange={(e) => setNewEBook({...newEBook, author: e.target.value})}
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input 
                id="isbn" 
                value={newEBook.isbn} 
                onChange={(e) => setNewEBook({...newEBook, isbn: e.target.value})}
                placeholder="Enter ISBN number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input 
                id="publisher" 
                value={newEBook.publisher} 
                onChange={(e) => setNewEBook({...newEBook, publisher: e.target.value})}
                placeholder="Enter publisher name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edition">Edition</Label>
              <Input 
                id="edition" 
                value={newEBook.edition} 
                onChange={(e) => setNewEBook({...newEBook, edition: e.target.value})}
                placeholder="Enter edition (e.g., 2nd Edition)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Number of Pages</Label>
              <Input 
                id="pages" 
                value={newEBook.pages} 
                onChange={(e) => setNewEBook({...newEBook, pages: e.target.value})}
                placeholder="Enter number of pages"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newEBook.category}
                onValueChange={(value) => setNewEBook({...newEBook, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Column - Additional Info & Uploads */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Additional Information</h2>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={newEBook.description} 
                onChange={(e) => setNewEBook({...newEBook, description: e.target.value})}
                placeholder="Enter e-book description"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newEBook.status}
                onValueChange={(value: 'Available' | 'Unavailable') => setNewEBook({...newEBook, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessRestriction">Access Restriction</Label>
              <Select
                value={newEBook.accessRestriction}
                onValueChange={(value: 'Public' | 'Members' | 'Admin') => setNewEBook({...newEBook, accessRestriction: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public (Anyone)</SelectItem>
                  <SelectItem value="Members">Members Only</SelectItem>
                  <SelectItem value="Admin">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 py-4">
              <Switch
                id="downloadable"
                checked={newEBook.downloadable}
                onCheckedChange={(checked) => setNewEBook({...newEBook, downloadable: checked})}
              />
              <Label htmlFor="downloadable">Allow Downloads</Label>
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="ebookFile">
                E-Book File <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="ebookFile" 
                type="file" 
                onChange={handleEbookFileChange}
                accept=".pdf,.epub,.mobi,.djvu"
                required
              />
              <p className="text-xs text-gray-500">Supported formats: PDF, EPUB, MOBI, DJVU</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image</Label>
              <Input 
                id="coverImage" 
                type="file" 
                onChange={handleCoverImageChange}
                accept="image/jpeg,image/png,image/webp"
              />
              <p className="text-xs text-gray-500">Recommended size: 800x1200px</p>
              
              {coverImagePreview && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Preview:</p>
                  <div className="w-32 h-48 relative">
                    <img 
                      src={coverImagePreview} 
                      alt="Cover preview" 
                      className="rounded border object-cover w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/ebooks')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add E-Book'}
          </Button>
        </div>
      </form>
    </div>
  );
} 