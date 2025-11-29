import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  _id?: string;
  title: string;
  author: string;
  isbn: string;
  category: string | { _id: string; name: string };
  publisher: string;
  edition: string;
  description: string;
  status: 'Available' | 'Unavailable';
  accessRestriction: 'Public' | 'Members' | 'Admin';
  downloadable: boolean;
  pages: string;
  coverImage?: string;
  fileUrl?: string;
}

export default function EditEBookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ebook, setEbook] = useState<EBook>({
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
  const [currentFilename, setCurrentFilename] = useState<string>('');

  // Fetch e-book and categories on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setFetchingData(true);
        
        // Fetch categories
        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse.data.success && Array.isArray(categoriesResponse.data.data)) {
          setCategories(categoriesResponse.data.data);
        }
        
        // Fetch e-book details
        if (id) {
          const ebookResponse = await api.get(`/ebooks/${id}`);
          if (ebookResponse.data && (ebookResponse.data.success || ebookResponse.data.data)) {
            const ebookData = ebookResponse.data.data || ebookResponse.data;
            
            // Format category if it's an object
            const formattedCategory = 
              typeof ebookData.category === 'object' && ebookData.category?._id 
                ? ebookData.category._id 
                : ebookData.category || '';
            
            // Set e-book data
            setEbook({
              ...ebookData,
              category: formattedCategory,
              pages: ebookData.pages?.toString() || ''
            });
            
            // Set cover image preview if available
            if (ebookData.coverImage) {
              setCoverImagePreview(getCoverImageUrl(ebookData.coverImage));
            }
            
            // Set current filename if available
            if (ebookData.fileUrl) {
              const filename = ebookData.fileUrl.split('/').pop() || 'Current file';
              setCurrentFilename(filename);
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to load e-book data",
              variant: "destructive",
            });
            navigate('/admin/ebooks');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        });
      } finally {
        setFetchingData(false);
      }
    }
    
    fetchData();
  }, [id, navigate, toast]);

  // Helper function to format cover image URL correctly
  const getCoverImageUrl = (imagePath?: string) => {
    if (!imagePath) return '';
    
    // If it's already a full URL (including Cloudinary URLs)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path, prefix with backend URL
    return `${import.meta.env.VITE_API_URL}/${imagePath}`;
  };

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
    
    // Basic validation
    if (!ebook.title?.trim() || !ebook.author?.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and author are required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Add all e-book data to formData
      Object.entries(ebook).forEach(([key, value]) => {
        // Skip _id and file-related fields
        if (
          key !== '_id' && 
          key !== 'fileUrl' && 
          key !== 'coverImage' && 
          value !== null && 
          value !== undefined && 
          value !== ''
        ) {
          formData.append(key, value.toString());
        }
      });
      
      // Add the e-book file if changed
      if (ebookFile) {
        formData.append('ebook', ebookFile);
      }
      
      // Add cover image if changed
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }

      // Log the form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${typeof value === 'string' ? value : 'File'}`);
      }

      const response = await api.put(`/ebooks/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data && (response.data.success || response.data.data)) {
        toast({
          title: "Success",
          description: "E-book updated successfully",
        });
        navigate('/admin/ebooks');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error updating e-book:', error);
      const errorMessage = error.response?.data?.message || "Failed to update e-book";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit E-Book</h1>
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
                value={ebook.title} 
                onChange={(e) => setEbook({...ebook, title: e.target.value})}
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
                value={ebook.author} 
                onChange={(e) => setEbook({...ebook, author: e.target.value})}
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input 
                id="isbn" 
                value={ebook.isbn} 
                onChange={(e) => setEbook({...ebook, isbn: e.target.value})}
                placeholder="Enter ISBN number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input 
                id="publisher" 
                value={ebook.publisher} 
                onChange={(e) => setEbook({...ebook, publisher: e.target.value})}
                placeholder="Enter publisher name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edition">Edition</Label>
              <Input 
                id="edition" 
                value={ebook.edition} 
                onChange={(e) => setEbook({...ebook, edition: e.target.value})}
                placeholder="Enter edition (e.g., 2nd Edition)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Number of Pages</Label>
              <Input 
                id="pages" 
                value={ebook.pages} 
                onChange={(e) => setEbook({...ebook, pages: e.target.value})}
                placeholder="Enter number of pages"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={typeof ebook.category === 'string' ? ebook.category : ''}
                onValueChange={(value) => setEbook({...ebook, category: value})}
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
                value={ebook.description} 
                onChange={(e) => setEbook({...ebook, description: e.target.value})}
                placeholder="Enter e-book description"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={ebook.status}
                onValueChange={(value: 'Available' | 'Unavailable') => setEbook({...ebook, status: value})}
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
                value={ebook.accessRestriction}
                onValueChange={(value: 'Public' | 'Members' | 'Admin') => setEbook({...ebook, accessRestriction: value})}
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
                checked={ebook.downloadable}
                onCheckedChange={(checked) => setEbook({...ebook, downloadable: checked})}
              />
              <Label htmlFor="downloadable">Allow Downloads</Label>
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="ebookFile">E-Book File</Label>
              <Input 
                id="ebookFile" 
                type="file" 
                onChange={handleEbookFileChange}
                accept=".pdf,.epub,.mobi,.djvu"
              />
              <p className="text-xs text-gray-500">
                Supported formats: PDF, EPUB, MOBI, DJVU
                {currentFilename && (
                  <span className="block mt-1 font-medium">Current file: {currentFilename}</span>
                )}
              </p>
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
                  <p className="text-sm mb-1">Cover image:</p>
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
            {loading ? 'Updating...' : 'Update E-Book'}
          </Button>
        </div>
      </form>
    </div>
  );
} 