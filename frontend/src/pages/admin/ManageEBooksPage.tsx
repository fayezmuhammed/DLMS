import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock e-book data
const mockEBooks = [
  {
    id: 1,
    title: 'Digital Fortress',
    author: 'Dan Brown',
    isbn: '978-0312995423',
    category: 'Thriller',
    format: 'PDF',
    size: '2.4 MB',
    addedOn: '2023-01-10'
  },
  {
    id: 2,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '978-0062315007',
    category: 'Fiction',
    format: 'EPUB',
    size: '1.8 MB',
    addedOn: '2023-02-15'
  },
  {
    id: 3,
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'Non-Fiction',
    format: 'PDF',
    size: '5.2 MB',
    addedOn: '2023-03-05'
  },
  {
    id: 4,
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    category: 'Self-Help',
    format: 'EPUB',
    size: '3.1 MB',
    addedOn: '2023-01-25'
  },
  {
    id: 5,
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    isbn: '978-0062457714',
    category: 'Self-Help',
    format: 'PDF',
    size: '2.7 MB',
    addedOn: '2023-02-28'
  }
];

interface EBook {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  format: string;
  size: string;
  addedOn: string;
  coverImage?: string;
}

const ManageEBooksPage: React.FC = () => {
  const [eBooks, setEBooks] = useState<EBook[]>(mockEBooks);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEBook, setNewEBook] = useState<Omit<EBook, 'id' | 'addedOn'>>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    format: 'PDF',
    size: '',
    coverImage: '',
  });
  const [editingEBook, setEditingEBook] = useState<EBook | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // State for cover image handling
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [editCoverImageFile, setEditCoverImageFile] = useState<File | null>(null);
  const [editCoverImagePreview, setEditCoverImagePreview] = useState<string>('');

  // Handle image upload for new e-book
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setCoverImagePreview(event.target.result);
          setNewEBook({...newEBook, coverImage: event.target.result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload for editing e-book
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingEBook) {
      const file = e.target.files[0];
      setEditCoverImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setEditCoverImagePreview(event.target.result);
          setEditingEBook({...editingEBook, coverImage: event.target.result});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEBook = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const newId = Math.max(...eBooks.map(book => book.id)) + 1;
    
    // In a real app, you would upload the image to a server first
    // and then save the URL. Here we're just using the preview URL.
    const eBookToAdd = {
      ...newEBook,
      id: newId,
      addedOn: currentDate
    };
    
    setEBooks([...eBooks, eBookToAdd]);
    setNewEBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      format: 'PDF',
      size: '',
      coverImage: '',
    });
    setCoverImageFile(null);
    setCoverImagePreview('');
    setIsAddDialogOpen(false);
  };

  const handleEditEBook = () => {
    if (editingEBook) {
      setEBooks(eBooks.map(book => 
        book.id === editingEBook.id ? editingEBook : book
      ));
      setIsEditDialogOpen(false);
      setEditingEBook(null);
      setEditCoverImageFile(null);
      setEditCoverImagePreview('');
    }
  };

  const handleDeleteEBook = (id: number) => {
    setEBooks(eBooks.filter(book => book.id !== id));
  };

  const filteredEBooks = eBooks.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage E-Books</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New E-Book</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New E-Book</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input 
                  id="title" 
                  value={newEBook.title} 
                  onChange={(e) => setNewEBook({...newEBook, title: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="author" className="text-right">Author</Label>
                <Input 
                  id="author" 
                  value={newEBook.author} 
                  onChange={(e) => setNewEBook({...newEBook, author: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isbn" className="text-right">ISBN</Label>
                <Input 
                  id="isbn" 
                  value={newEBook.isbn} 
                  onChange={(e) => setNewEBook({...newEBook, isbn: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Input 
                  id="category" 
                  value={newEBook.category} 
                  onChange={(e) => setNewEBook({...newEBook, category: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="format" className="text-right">Format</Label>
                <Select 
                  value={newEBook.format} 
                  onValueChange={(value) => setNewEBook({...newEBook, format: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EPUB">EPUB</SelectItem>
                    <SelectItem value="MOBI">MOBI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="size" className="text-right">Size</Label>
                <Input 
                  id="size" 
                  value={newEBook.size} 
                  onChange={(e) => setNewEBook({...newEBook, size: e.target.value})}
                  className="col-span-3" 
                  placeholder="e.g., 2.4 MB"
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddEBook}>Add E-Book</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search e-books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Author</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">ISBN</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Format</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Size</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Added On</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredEBooks.map((book) => (
                  <tr key={book.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">{book.title}</td>
                    <td className="p-4 align-middle">{book.author}</td>
                    <td className="p-4 align-middle">{book.isbn}</td>
                    <td className="p-4 align-middle">{book.category}</td>
                    <td className="p-4 align-middle">{book.format}</td>
                    <td className="p-4 align-middle">{book.size}</td>
                    <td className="p-4 align-middle">{book.addedOn}</td>
                    <td className="p-4 align-middle">
                      <div className="flex justify-center space-x-2">
                        <Dialog open={isEditDialogOpen && editingEBook?.id === book.id} onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (!open) {
                            setEditingEBook(null);
                            setEditCoverImagePreview('');
                            setEditCoverImageFile(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingEBook(book);
                                setEditCoverImagePreview(book.coverImage || '');
                              }}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                              <DialogTitle>Edit E-Book</DialogTitle>
                            </DialogHeader>
                            {editingEBook && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-title" className="text-right">Title</Label>
                                  <Input 
                                    id="edit-title" 
                                    value={editingEBook.title} 
                                    onChange={(e) => setEditingEBook({...editingEBook, title: e.target.value})}
                                    className="col-span-3" 
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-author" className="text-right">Author</Label>
                                  <Input 
                                    id="edit-author" 
                                    value={editingEBook.author} 
                                    onChange={(e) => setEditingEBook({...editingEBook, author: e.target.value})}
                                    className="col-span-3" 
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-isbn" className="text-right">ISBN</Label>
                                  <Input 
                                    id="edit-isbn" 
                                    value={editingEBook.isbn} 
                                    onChange={(e) => setEditingEBook({...editingEBook, isbn: e.target.value})}
                                    className="col-span-3" 
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-category" className="text-right">Category</Label>
                                  <Input 
                                    id="edit-category" 
                                    value={editingEBook.category} 
                                    onChange={(e) => setEditingEBook({...editingEBook, category: e.target.value})}
                                    className="col-span-3" 
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-format" className="text-right">Format</Label>
                                  <Select 
                                    value={editingEBook.format} 
                                    onValueChange={(value) => setEditingEBook({...editingEBook, format: value})}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PDF">PDF</SelectItem>
                                      <SelectItem value="EPUB">EPUB</SelectItem>
                                      <SelectItem value="MOBI">MOBI</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-size" className="text-right">Size</Label>
                                  <Input 
                                    id="edit-size" 
                                    value={editingEBook.size} 
                                    onChange={(e) => setEditingEBook({...editingEBook, size: e.target.value})}
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
                                    {(editCoverImagePreview || editingEBook.coverImage) && (
                                      <div className="mt-2">
                                        <div className="text-sm text-gray-500 mb-1">Preview:</div>
                                        <div className="relative w-28 h-40 overflow-hidden rounded-md border border-gray-200">
                                          <img 
                                            src={editCoverImagePreview || editingEBook.coverImage} 
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
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                              <Button onClick={handleEditEBook}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteEBook(book.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageEBooksPage; 