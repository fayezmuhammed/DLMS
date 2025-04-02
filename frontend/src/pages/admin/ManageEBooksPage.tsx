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

const ManageEBooksPage: React.FC = () => {
  const { toast } = useToast();
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // New e-book form state
  const [newEBook, setNewEBook] = useState({
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

  // Edit e-book state
  const [editingEBook, setEditingEBook] = useState<EBook | null>(null);
  const [editCoverImageFile, setEditCoverImageFile] = useState<File | null>(null);
  const [editEbookFile, setEditEbookFile] = useState<File | null>(null);
  const [editCoverImagePreview, setEditCoverImagePreview] = useState<string>('');

  // Fetch e-books and categories on component mount
  useEffect(() => {
    fetchEbooks();
    fetchCategories();
  }, []);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      const response = await ebookService.getEBooks();
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

  // Handle cover image file selection
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setCoverImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle e-book file selection
  const handleEbookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEbookFile(e.target.files[0]);
    }
  };
  
  // Handle input changes for the new e-book form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEBook(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes for the new e-book form
  const handleSelectChange = (name: string, value: string | boolean) => {
    setNewEBook(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission to add a new e-book
  const handleAddEBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newEBook.title || !newEBook.author) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Author)",
        variant: "destructive",
      });
      return;
    }
    
    if (!ebookFile) {
      toast({
        title: "Validation Error",
        description: "Please select an e-book file to upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('title', newEBook.title);
      formData.append('author', newEBook.author);
      
      // Optional fields
      if (newEBook.isbn) formData.append('isbn', newEBook.isbn);
      if (newEBook.category) formData.append('category', newEBook.category);
      if (newEBook.publisher) formData.append('publisher', newEBook.publisher);
      if (newEBook.edition) formData.append('edition', newEBook.edition);
      if (newEBook.description) formData.append('description', newEBook.description);
      
      // Other fields
      formData.append('status', newEBook.status);
      formData.append('accessRestriction', newEBook.accessRestriction);
      formData.append('downloadable', String(newEBook.downloadable));
      
      if (newEBook.pages) {
        formData.append('pages', newEBook.pages.toString());
      }
      
      // Append files
      formData.append('ebook', ebookFile);
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }
      
      // Submit the form
      await ebookService.createEBook(formData);
      
      // Show success message
      toast({
        title: "Success",
        description: "E-book added successfully",
      });
      
      // Reset form and close dialog
      setNewEBook({
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
      setEbookFile(null);
      setCoverImageFile(null);
      setCoverImagePreview('');
      setIsAddDialogOpen(false);
      
      // Refresh e-books list
      fetchEbooks();
    } catch (error) {
      console.error('Error adding e-book:', error);
      toast({
        title: "Error",
        description: "Failed to add e-book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle edit cover image change
  const handleEditCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditCoverImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setEditCoverImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle edit e-book file change
  const handleEditEbookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditEbookFile(e.target.files[0]);
    }
  };

  // Handle edit input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingEBook) {
      const { name, value } = e.target;
      setEditingEBook(prev => prev ? { ...prev, [name]: value } : null);
    }
  };
  
  // Handle edit select changes
  const handleEditSelectChange = (name: string, value: string | boolean) => {
    if (editingEBook) {
      setEditingEBook(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  // Handle edit e-book submission
  const handleEditEBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEBook) return;

    // Validate form
    if (!editingEBook.title || !editingEBook.author) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Author)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('title', editingEBook.title);
      formData.append('author', editingEBook.author);
      
      // Optional fields
      if (editingEBook.isbn) formData.append('isbn', editingEBook.isbn);
      
      // Handle category which could be an object or string
      if (editingEBook.category) {
        formData.append('category', typeof editingEBook.category === 'object' 
          ? editingEBook.category._id 
          : editingEBook.category);
      }
      
      // Other fields
      formData.append('publisher', editingEBook.publisher || '');
      formData.append('edition', editingEBook.edition || '');
      formData.append('description', editingEBook.description || '');
      formData.append('status', editingEBook.status);
      formData.append('accessRestriction', editingEBook.accessRestriction);
      formData.append('downloadable', String(editingEBook.downloadable));
      
      if (editingEBook.pages) {
        formData.append('pages', editingEBook.pages.toString());
      }
      
      // Append files if new ones are selected
      if (editEbookFile) {
        formData.append('ebook', editEbookFile);
      }
      if (editCoverImageFile) {
        formData.append('coverImage', editCoverImageFile);
      }
      
      // Submit the form
      await ebookService.updateEBook(editingEBook._id, formData);
      
      // Show success message
      toast({
        title: "Success",
        description: "E-book updated successfully",
      });
      
      // Reset form and close dialog
      setEditingEBook(null);
      setEditEbookFile(null);
      setEditCoverImageFile(null);
      setEditCoverImagePreview('');
      setIsEditDialogOpen(false);
      
      // Refresh e-books list
      fetchEbooks();
    } catch (error) {
      console.error('Error updating e-book:', error);
      toast({
        title: "Error",
        description: "Failed to update e-book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage E-Books</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button className="flex items-center" onClick={() => setIsAddDialogOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New E-Book
          </Button>
          
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New E-Book</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddEBook} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title*</Label>
                    <Input 
                      id="title" 
                      name="title"
                      placeholder="E-book title" 
                      value={newEBook.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="author">Author*</Label>
                    <Input 
                      id="author" 
                      name="author"
                      placeholder="Author name" 
                      value={newEBook.author}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input 
                      id="isbn" 
                      name="isbn"
                      placeholder="ISBN number" 
                      value={newEBook.isbn}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newEBook.category}
                      onValueChange={(value) => handleSelectChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input 
                      id="publisher" 
                      name="publisher"
                      placeholder="Publisher name" 
                      value={newEBook.publisher}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edition">Edition</Label>
                    <Input 
                      id="edition" 
                      name="edition"
                      placeholder="Edition" 
                      value={newEBook.edition}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newEBook.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accessRestriction">Access Level</Label>
                    <Select
                      value={newEBook.accessRestriction}
                      onValueChange={(value) => handleSelectChange('accessRestriction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Members">Members Only</SelectItem>
                        <SelectItem value="Premium">Premium Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="downloadable">Downloadable</Label>
                    <Select
                      value={newEBook.downloadable ? 'true' : 'false'}
                      onValueChange={(value) => handleSelectChange('downloadable', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Can be downloaded?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pages">Number of Pages</Label>
                    <Input 
                      id="pages" 
                      name="pages"
                      type="number"
                      placeholder="Number of pages" 
                      value={newEBook.pages}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ebook-file">E-Book File* (PDF, EPUB, etc.)</Label>
                    <Input 
                      id="ebook-file" 
                      type="file"
                      accept=".pdf,.epub,.EPUB,.mobi,.doc,.docx,.txt"
                      onChange={handleEbookFileChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, EPUB, MOBI, DOC, DOCX, TXT
                    </p>
                    {ebookFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {ebookFile.name} ({(ebookFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cover-image">Cover Image</Label>
                    <Input 
                      id="cover-image" 
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                    />
                    {coverImagePreview && (
                      <div className="mt-2 relative aspect-[3/4] w-20 overflow-hidden rounded-md border border-gray-200">
                        <img 
                          src={coverImagePreview} 
                          alt="Cover preview" 
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="E-book description" 
                  value={newEBook.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? 'Adding...' : 'Add E-Book'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-between items-center">
        <Input
          type="search"
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
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
                      onClick={async () => {
                        try {
                          const response = await ebookService.getEBook(ebook._id);
                          if (response && response.success) {
                            // Handle different response structures
                            const ebookData = response.data || response.ebook;
                            if (ebookData) {
                              setEditingEBook(ebookData);
                              setEditCoverImagePreview(ebookData.coverImage || ebookData.image || '');
                              setIsEditDialogOpen(true);
                            } else {
                              throw new Error('Invalid response structure');
                            }
                          } else {
                            throw new Error('Failed to fetch e-book data');
                          }
                        } catch (error) {
                          console.error('Error fetching e-book details:', error);
                          toast({
                            title: "Error",
                            description: "Failed to fetch e-book details",
                            variant: "destructive",
                          });
                        }
                      }}
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
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await ebookService.getEBook(ebook._id);
                                if (response && response.success) {
                                  // Handle different response structures
                                  const ebookData = response.data || response.ebook;
                                  if (ebookData) {
                                    setEditingEBook(ebookData);
                                    setEditCoverImagePreview(ebookData.coverImage || ebookData.image || '');
                                    setIsEditDialogOpen(true);
                                  } else {
                                    throw new Error('Invalid response structure');
                                  }
                                } else {
                                  throw new Error('Failed to fetch e-book data');
                                }
                              } catch (error) {
                                console.error('Error fetching e-book details:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to fetch e-book details",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${ebook.title}"?`)) {
                                handleDeleteEBook(ebook._id);
                              }
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen && editingEBook !== null} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingEBook(null);
          setEditEbookFile(null);
          setEditCoverImageFile(null);
          setEditCoverImagePreview('');
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit E-Book</DialogTitle>
          </DialogHeader>
          
          {editingEBook && (
            <form onSubmit={handleEditEBook} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title*</Label>
                    <Input 
                      id="edit-title" 
                      name="title"
                      placeholder="E-book title" 
                      value={editingEBook.title}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-author">Author*</Label>
                    <Input 
                      id="edit-author" 
                      name="author"
                      placeholder="Author name" 
                      value={editingEBook.author}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-isbn">ISBN</Label>
                    <Input 
                      id="edit-isbn" 
                      name="isbn"
                      placeholder="ISBN number" 
                      value={editingEBook.isbn}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={typeof editingEBook.category === 'object' ? editingEBook.category._id : editingEBook.category}
                      onValueChange={(value) => handleEditSelectChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-publisher">Publisher</Label>
                    <Input 
                      id="edit-publisher" 
                      name="publisher"
                      placeholder="Publisher name" 
                      value={editingEBook.publisher}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-edition">Edition</Label>
                    <Input 
                      id="edit-edition" 
                      name="edition"
                      placeholder="Edition" 
                      value={editingEBook.edition}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingEBook.status}
                      onValueChange={(value) => handleEditSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-accessRestriction">Access Level</Label>
                    <Select
                      value={editingEBook.accessRestriction}
                      onValueChange={(value) => handleEditSelectChange('accessRestriction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Members">Members Only</SelectItem>
                        <SelectItem value="Premium">Premium Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-downloadable">Downloadable</Label>
                    <Select
                      value={editingEBook.downloadable ? 'true' : 'false'}
                      onValueChange={(value) => handleEditSelectChange('downloadable', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Can be downloaded?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-pages">Number of Pages</Label>
                    <Input 
                      id="edit-pages" 
                      name="pages"
                      type="number"
                      placeholder="Number of pages" 
                      value={editingEBook.pages}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-ebook-file">E-Book File (PDF, EPUB, etc.)</Label>
                    <Input 
                      id="edit-ebook-file" 
                      type="file"
                      accept=".pdf,.epub,.EPUB,.mobi,.doc,.docx,.txt"
                      onChange={handleEditEbookFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, EPUB, MOBI, DOC, DOCX, TXT
                    </p>
                    {editEbookFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {editEbookFile.name} ({(editEbookFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-cover-image">Cover Image</Label>
                    <Input 
                      id="edit-cover-image" 
                      type="file"
                      accept="image/*"
                      onChange={handleEditCoverImageChange}
                    />
                    {(editCoverImagePreview || editingEBook.coverImage) && (
                      <div className="mt-2 relative aspect-[3/4] w-20 overflow-hidden rounded-md border border-gray-200">
                        <img 
                          src={editCoverImagePreview || editingEBook.coverImage} 
                          alt="Cover preview" 
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description"
                  placeholder="E-book description" 
                  value={editingEBook.description}
                  onChange={handleEditInputChange}
                  rows={3}
                />
              </div>
              
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageEBooksPage; 