import React, { useState, ChangeEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";
import { Book, bookService } from '@/services/bookService';
import { Category } from '@/services/bookService';
import { Plus } from 'lucide-react';

// Helper function to safely render any value
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'object') {
    // For category objects that have a name property
    if (value.name) return value.name;
    // Fallback for other objects - don't render directly
    return '[Object]';
  }
  return String(value);
};

export default function ManageBooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState<Omit<Book, '_id' | 'addedOn'>>({
    bookNo: '',
    title: '',
    author: '',
    ISBN: '',
    category: '',
    status: 'Available',
    copies: 1,
    coverImage: ''
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  
  // Add edit state variables
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCoverImageFile, setEditCoverImageFile] = useState<File | null>(null);
  const [editCoverImagePreview, setEditCoverImagePreview] = useState<string>('');

  const navigate = useNavigate();

  // Fetch books and categories on component mount
  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getBooks();
      setBooks(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await bookService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  // Filter books based on search term
  const filteredBooks = books.filter((book: Book) =>
    (book.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (book.author?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (book.ISBN || book.isbn || '').includes(searchTerm)
  );

  // Handle image upload
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && typeof event.target.result === 'string') {
          setCoverImagePreview(event.target.result);
          setNewBook({...newBook, coverImage: event.target.result});
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle edit image upload
  const handleEditImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingBook) {
      const file = e.target.files[0];
      setEditCoverImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && typeof event.target.result === 'string') {
          setEditCoverImagePreview(event.target.result);
          setEditingBook({...editingBook, coverImage: event.target.result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add book handler
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      // Add book data to formData
      formData.append('bookNo', newBook.bookNo);
      formData.append('title', newBook.title);
      formData.append('author', newBook.author);
      
      // Add optional fields only if they have values
      if (newBook.ISBN) {
        formData.append('ISBN', newBook.ISBN);
      }
      
      if (newBook.category) {
        // Ensure category is a string value
        const categoryValue = typeof newBook.category === 'object' && newBook.category !== null
          ? newBook.category._id 
          : String(newBook.category);
        formData.append('category', categoryValue);
      }
      
      if (coverImageFile) {
        formData.append('image', coverImageFile);
      }

      await bookService.createBook(formData);
      
      toast({
        title: "Success",
        description: "Book added successfully",
      });
      
      fetchBooks(); // Refresh books list
      setIsAddDialogOpen(false);
      setNewBook({
        bookNo: '',
        title: '',
        author: '',
        ISBN: '',
        category: '',
        status: 'Available',
        copies: 1,
        coverImage: ''
      });
      setCoverImageFile(null);
      setCoverImagePreview('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add book",
        variant: "destructive",
      });
    }
  };

  // Edit book handler
  const handleEditBook = async () => {
    if (editingBook) {
      // Validate required fields
      if (!editingBook.title || !editingBook.author) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Title, Author)",
          variant: "destructive",
        });
        return;
      }

      try {
        setLoading(true);
        
        // Create form data for the edit
        const formData = new FormData();
        formData.append('title', editingBook.title);
        formData.append('author', editingBook.author);
        
        // Add ISBN only if it has a value
        if (editingBook.ISBN || editingBook.isbn) {
          formData.append('ISBN', editingBook.ISBN || editingBook.isbn || '');
        }
        
        // Handle category properly - only add if present
        if (editingBook.category) {
          const categoryValue = typeof editingBook.category === 'object' 
            ? editingBook.category._id 
            : editingBook.category;
          
          if (categoryValue) {
            formData.append('category', categoryValue);
          }
        }
        
        formData.append('status', editingBook.status);
        formData.append('copies', editingBook.copies.toString());
        
        // Add image if there's a new one
        if (editCoverImageFile) {
          formData.append('image', editCoverImageFile);
        }

        // Send the update to the server
        await bookService.updateBook(editingBook._id, formData);
        
        // Refresh the book list
        await fetchBooks();
        
        toast({
          title: "Success",
          description: `Book "${editingBook.title}" has been updated successfully`,
        });
        
        // Close dialog and reset state
        setIsEditDialogOpen(false);
        setEditingBook(null);
        setEditCoverImageFile(null);
        setEditCoverImagePreview('');
      } catch (error) {
        console.error('Error updating book:', error);
        toast({
          title: "Error",
          description: "Failed to update book. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete book handler
  const handleDeleteBook = async (id: string) => {
    try {
      await bookService.deleteBook(id);
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      fetchBooks(); // Refresh books list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Books</h1>
        <div className="space-x-2">
          <Button 
            onClick={() => navigate('/admin/books/add')}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Book</span>
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <Input
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {/* Add Book Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBook}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bookNo" className="text-right">Book No.</Label>
                <Input 
                  id="bookNo" 
                  value={newBook.bookNo} 
                  onChange={(e) => setNewBook({...newBook, bookNo: e.target.value})}
                  className="col-span-3" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  value={newBook.title} 
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="col-span-3" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="author" className="text-right">Author</Label>
                <Input 
                  id="author" 
                  value={newBook.author} 
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  className="col-span-3" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ISBN" className="text-right">ISBN (Optional)</Label>
                <Input 
                  id="ISBN" 
                  value={newBook.ISBN} 
                  onChange={(e) => setNewBook({...newBook, ISBN: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category (Optional)</Label>
                <Select 
                  value={newBook.category?.toString() || ''}
                  onValueChange={(value) => setNewBook({...newBook, category: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select 
                  value={newBook.status} 
                  onValueChange={(value: any) => setNewBook({...newBook, status: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="copies" className="text-right">Copies</Label>
                <Input 
                  id="copies" 
                  type="number"
                  min="1"
                  value={newBook.copies.toString()} 
                  onChange={(e) => setNewBook({...newBook, copies: parseInt(e.target.value) || 1})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="coverImage" className="text-right pt-2">Cover Image</Label>
                <div className="col-span-3 space-y-2">
                  <Input 
                    id="coverImage" 
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="col-span-3" 
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
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Book</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border rounded-lg shadow-sm">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="py-3 px-4 text-left">Book No.</th>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Author</th>
                  <th className="py-3 px-4 text-left">ISBN</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Copies</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book: Book) => (
                    <tr 
                      key={book._id} 
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">{book.bookNo}</td>
                      <td className="py-3 px-4">{book.title}</td>
                      <td className="py-3 px-4">{book.author}</td>
                      <td className="py-3 px-4">{book.ISBN || book.isbn}</td>
                      <td className="py-3 px-4">
                        {safeRender(book.category)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          book.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {book.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{book.copies}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/books/edit/${book._id}`);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
                                handleDeleteBook(book._id);
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
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      No books found. Try adjusting your search.
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
}