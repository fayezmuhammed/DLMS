import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock e-books data
const mockEBooks = [
  {
    id: 1,
    title: 'Digital Design Principles',
    author: 'Sarah Johnson',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
    format: 'PDF',
    size: '8.5 MB',
    description: 'A comprehensive guide to digital design principles and practices.',
  },
  {
    id: 2,
    title: 'Modern Web Development',
    author: 'Michael Chen',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
    format: 'EPUB',
    size: '4.2 MB',
    description: 'Learn modern web development techniques and best practices.',
  },
  {
    id: 3,
    title: 'Data Science Fundamentals',
    author: 'Emily Rodriguez',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg',
    format: 'PDF',
    size: '12.1 MB',
    description: 'An introduction to data science concepts and methodologies.',
  },
];

const EBooksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEBooks = mockEBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">E-Books Collection</h1>
          <Input
            type="search"
            placeholder="Search e-books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEBooks.map((book) => (
            <Card key={book.id} className="flex flex-col">
              <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">{book.description}</p>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{book.format}</span>
                  <span>{book.size}</span>
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button className="w-full">Download</Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredEBooks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No e-books found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EBooksPage; 