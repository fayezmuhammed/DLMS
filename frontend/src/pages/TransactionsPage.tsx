import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Mock transactions data
const mockCurrentTransactions = [
  {
    id: 1,
    bookTitle: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    borrowDate: '2024-03-01',
    dueDate: '2024-03-15',
    status: 'Active',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
  },
  {
    id: 2,
    bookTitle: '1984',
    author: 'George Orwell',
    borrowDate: '2024-03-05',
    dueDate: '2024-03-19',
    status: 'Overdue',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
  },
];

const mockTransactionHistory = [
  {
    id: 3,
    bookTitle: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    borrowDate: '2024-02-01',
    returnDate: '2024-02-15',
    status: 'Returned',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg',
  },
  {
    id: 4,
    bookTitle: 'Pride and Prejudice',
    author: 'Jane Austen',
    borrowDate: '2024-01-15',
    returnDate: '2024-01-29',
    status: 'Returned',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg',
  },
];

const TransactionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('current');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Transactions</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your book borrowing history
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Borrows</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {mockCurrentTransactions.map((transaction) => (
            <Card key={transaction.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-48 flex-shrink-0">
                    <img
                      src={transaction.coverImage}
                      alt={transaction.bookTitle}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-grow space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{transaction.bookTitle}</h3>
                      <p className="text-muted-foreground">by {transaction.author}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Borrow Date</p>
                        <p className="font-medium">{formatDate(transaction.borrowDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-medium">{formatDate(transaction.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      {transaction.status === 'Active' && (
                        <div className="text-sm">
                          {calculateDaysLeft(transaction.dueDate)} days remaining
                        </div>
                      )}
                      <Button variant="outline">Return Book</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {mockCurrentTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No current borrows</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {mockTransactionHistory.map((transaction) => (
            <Card key={transaction.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-48 flex-shrink-0">
                    <img
                      src={transaction.coverImage}
                      alt={transaction.bookTitle}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-grow space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{transaction.bookTitle}</h3>
                      <p className="text-muted-foreground">by {transaction.author}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Borrow Date</p>
                        <p className="font-medium">{formatDate(transaction.borrowDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Return Date</p>
                        <p className="font-medium">{formatDate(transaction.returnDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <Button variant="outline">Borrow Again</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {mockTransactionHistory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transaction history</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage; 