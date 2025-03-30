import React, { useState, ChangeEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";
import { Book, bookService } from '@/services/bookService';

// Helper function to safely render any value
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState<Omit<Book, '_id' | 'addedOn'>>({
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

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
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

  // Filter books based on search term
  const filteredBooks = books.filter((book: Book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.ISBN.includes(searchTerm)
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
      formData.append('title', newBook.title);
      formData.append('author', newBook.author);
      formData.append('ISBN', newBook.ISBN);
      formData.append('category', newBook.category);
      
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
  const handleEditBook = () => {
    if (editingBook) {
      // Validate required fields
      if (!editingBook.title || !editingBook.author || !editingBook.ISBN) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Title, Author, ISBN)",
          variant: "destructive",
        });
        return;
      }

      setBooks(books.map((book: Book) => 
        book._id === editingBook._id ? editingBook : book
      ));
      toast({
        title: "Success",
        description: `Book "${editingBook.title}" has been updated successfully`,
      });
      setIsEditDialogOpen(false);
      setEditingBook(null);
      setEditCoverImageFile(null);
      setEditCoverImagePreview('');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage Books</h1>
        <Link to="/admin/books/add">
          <Button className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Book
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <Input
          type="search"
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                  <th className="py-3 px-4 text-left">ISBN</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Copies</th>
                  <th className="py-3 px-4 text-left">Added On</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book: Book) => (
                    <tr key={book._id} className="border-b hover:bg-muted/50">
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
                      <td className="py-3 px-4">{book.addedOn}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <Dialog open={isEditDialogOpen && editingBook?._id === book._id} onOpenChange={(open: boolean) => {
                            setIsEditDialogOpen(open);
                            if (!open) {
                              setEditingBook(null);
                              setEditCoverImagePreview('');
                              setEditCoverImageFile(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                className="bg-secondary h-9 px-3 rounded-md"
                                onClick={() => {
                                  setEditingBook(book);
                                  setEditCoverImagePreview(book.coverImage || '');
                                }}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px]">
                              <DialogHeader>
                                <DialogTitle>Edit Book</DialogTitle>
                              </DialogHeader>
                              {editingBook && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-title" className="text-right">Title</Label>
                                    <Input 
                                      id="edit-title" 
                                      value={editingBook.title} 
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingBook({...editingBook, title: e.target.value})}
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-author" className="text-right">Author</Label>
                                    <Input 
                                      id="edit-author" 
                                      value={editingBook.author} 
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingBook({...editingBook, author: e.target.value})}
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-ISBN" className="text-right">ISBN</Label>
                                    <Input 
                                      id="edit-ISBN" 
                                      value={editingBook.ISBN} 
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingBook({...editingBook, ISBN: e.target.value})}
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-category" className="text-right">Category</Label>
                                    <Input 
                                      id="edit-category" 
                                      value={safeRender(editingBook.category)}
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingBook({...editingBook, category: e.target.value})}
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                                    <select
                                      className="col-span-3 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                      value={editingBook.status}
                                      onChange={(e) => setEditingBook({...editingBook, status: e.target.value as any})}
                                    >
                                      <option value="">Select status</option>
                                      <option value="Available">Available</option>
                                      <option value="Reserved">Reserved</option>
                                      <option value="Issued">Issued</option>
                                      <option value="Lost">Lost</option>
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-copies" className="text-right">Copies</Label>
                                    <Input 
                                      id="edit-copies" 
                                      type="number"
                                      min="1"
                                      value={editingBook.copies.toString()} 
                                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingBook({...editingBook, copies: parseInt(e.target.value) || 1})}
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="edit-coverImage" className="text-right pt-2">Cover Image</Label>
                                    <div className="col-span-3 space-y-2">
                                      <Input 
                                        id="edit-coverImage" 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageChange}
                                        className="col-span-3" 
                                      />
                                      {(editCoverImagePreview || editingBook.coverImage) && (
                                        <div className="mt-2">
                                          <div className="text-sm text-gray-500 mb-1">Preview:</div>
                                          <div className="relative w-28 h-40 overflow-hidden rounded-md border border-gray-200">
                                            <img 
                                              src={editCoverImagePreview || editingBook.coverImage} 
                                              alt="Cover preview" 
                                              className="object-cover w-full h-full"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button className="bg-secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleEditBook}>Save Changes</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3 rounded-md"
                            onClick={() => {
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