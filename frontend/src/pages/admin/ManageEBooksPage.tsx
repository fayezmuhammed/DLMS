import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { EBook, ebookService } from '@/services/ebookService';
import { Category, bookService } from '@/services/bookService';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { PencilIcon } from '@heroicons/react/24/outline';

const ManageEBooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Fetch e-books and categories on component mount
  useEffect(() => {
    fetchEbooks();
    fetchCategories();
  }, []);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      const response = await ebookService.getEBooks();
      
      // Log response to debug cover image issues
      console.log('Fetched e-books response:', response);
      if (response.data && response.data.length > 0) {
        console.log('First e-book coverImage:', response.data[0].coverImage);
      }
      
      setEbooks(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching e-books:', err);
      setError('Failed to fetch e-books. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await bookService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

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

  // Filter e-books based on search term
  const filteredEbooks = ebooks.filter(ebook =>
    ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format file size in a readable format
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

  // Handle delete e-book
  const handleDeleteEBook = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this e-book?')) {
      try {
        await ebookService.deleteEBook(id);
        toast({
          title: "Success",
          description: "E-book deleted successfully",
        });
        fetchEbooks(); // Refresh e-books list
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete e-book",
          variant: "destructive",
        });
      }
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
        <Button onClick={() => fetchEbooks()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Manage E-Books</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search e-books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          
          <Button 
            onClick={() => navigate('/admin/ebooks/add')}
            className="whitespace-nowrap"
          >
            Add New E-Book
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Author</th>
                  <th className="py-3 px-4 text-left">Format</th>
                  <th className="py-3 px-4 text-left">Size</th>
                  <th className="py-3 px-4 text-left">Access</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEbooks.length > 0 ? (
                  filteredEbooks.map(ebook => (
                    <tr 
                      key={ebook._id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/admin/ebooks/edit/${ebook._id}`)}
                    >
                      <td className="py-3 px-4">{ebook.title}</td>
                      <td className="py-3 px-4">{ebook.author}</td>
                      <td className="py-3 px-4">{ebook.fileType.toUpperCase()}</td>
                      <td className="py-3 px-4">{formatFileSize(ebook.fileSize)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ebook.accessRestriction === 'Public' 
                            ? 'bg-blue-100 text-blue-800' 
                            : ebook.accessRestriction === 'Members'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ebook.accessRestriction}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ebook.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ebook.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/ebooks/edit/${ebook._id}`);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEBook(ebook._id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No e-books found. Try adjusting your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageEBooksPage; 