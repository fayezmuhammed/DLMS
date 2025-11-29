import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Reservation, reservationService } from '@/services/reservationService';
import { Book } from '@/services/bookService';
import { AlertCircle, BookOpen, Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReservationWithBook extends Reservation {
  book: Book;
}

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Format date to readable string
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate time remaining
  const calculateTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m remaining`;
  };

  // Load reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await reservationService.getUserReservations();
        
        if (response.success) {
          setReservations(response.data as ReservationWithBook[]);
        } else {
          setError('Failed to load reservations');
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Failed to load reservations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservations();
  }, []);

  // Handle cancellation of a reservation
  const handleCancelReservation = async (id: string) => {
    try {
      setCancellingId(id);
      const response = await reservationService.cancelReservation(id);
      
      if (response.success) {
        setReservations(reservations.filter(r => r._id !== id));
        toast({
          title: 'Success',
          description: 'Reservation cancelled successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to cancel reservation',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel reservation. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading your reservations...</div>;
  }

  if (error) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="mr-2" />
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p>{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">No Active Reservations</h2>
          <p className="text-muted-foreground mb-6">
            You don't have any active book reservations. Browse our collection and reserve books for pickup.
          </p>
          <Button asChild>
            <Link to="/books">Browse Books</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Reservations</h1>
          <Button variant="outline" asChild>
            <Link to="/books">Browse More Books</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Reserved At</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div>
                          <Link to={`/books/${(reservation.book as Book)._id}`} className="font-medium hover:underline">
                            {(reservation.book as Book).title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {(reservation.book as Book).author}
                          </div>
                          {reservation.status === 'active' && (
                            <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">
                              <Check className="mr-1 h-3 w-3" /> Ready for pickup
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(reservation.reservedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span className={
                          calculateTimeRemaining(reservation.expiresAt) === 'Expired' 
                            ? 'text-red-500' 
                            : 'text-amber-500'
                        }>
                          {calculateTimeRemaining(reservation.expiresAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancellingId === reservation._id}
                        onClick={() => handleCancelReservation(reservation._id)}
                      >
                        {cancellingId === reservation._id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center text-amber-800 mb-2">
            <Clock className="mr-2 h-5 w-5" />
            <h3 className="font-semibold">Reservation Policy</h3>
          </div>
          <p className="text-sm text-amber-700 mb-2">
            Book reservations are valid for 24 hours only. Please pick up your reserved books within this time frame.
            After 24 hours, reservations expire automatically and the books become available to other users.
          </p>
          <div className="flex items-center text-amber-800 mt-3">
            <AlertCircle className="mr-2 h-5 w-5" />
            <h3 className="font-semibold">Reservation Limit</h3>
          </div>
          <p className="text-sm text-amber-700">
            You can have a maximum of 3 active reservations at a time. 
            If you need to reserve additional books, please cancel an existing reservation or check out your reserved books first.
          </p>
          <div className="mt-2 bg-amber-100 p-2 rounded flex items-center">
            <span className="font-medium mr-2">Your current reservations:</span>
            <span className={`font-bold ${reservations.length >= 3 ? 'text-red-600' : 'text-green-600'}`}>
              {reservations.length}/3
            </span>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded flex items-center text-green-800">
            <Check className="h-5 w-5 mr-2" />
            <div>
              <h3 className="font-semibold">Ready for Pickup</h3>
              <p className="text-sm">
                Books marked as "Ready for pickup" can be collected from the library's front desk. 
                Please bring your ID card when collecting books.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationsPage; 