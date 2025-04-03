import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertCircle, BookOpen, Clock, RefreshCw, X } from 'lucide-react';
import AdminPageTitle from '@/components/admin/AdminPageTitle';

interface ExtendedReservation extends Reservation {
  book: Book;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

const ManageReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<ExtendedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [checkingExpired, setCheckingExpired] = useState(false);
  const [expiredCount, setExpiredCount] = useState(0);

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

  // Load all reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getAllReservations();
      
      if (response.success) {
        setReservations(response.data);
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

  // Initial data load
  useEffect(() => {
    fetchReservations();
  }, []);

  // Handle cancellation of a reservation
  const handleCancelReservation = async (id: string) => {
    try {
      setCancellingId(id);
      const response = await reservationService.cancelReservation(id);
      
      if (response.success) {
        // Update the local state to reflect the cancellation
        setReservations(prevReservations => 
          prevReservations.map(r => 
            r._id === id ? { ...r, status: 'cancelled' } : r
          )
        );

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

  // Check for and expire outdated reservations
  const handleCheckExpiredReservations = async () => {
    try {
      setCheckingExpired(true);
      const response = await reservationService.expireOutdatedReservations();
      
      if (response.success) {
        setExpiredCount(response.count);
        
        // Refresh the reservation list
        fetchReservations();
        
        toast({
          title: 'Success',
          description: `${response.count} outdated reservations have been expired.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to check expired reservations',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error checking expired reservations:', err);
      toast({
        title: 'Error',
        description: 'Failed to check expired reservations. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setCheckingExpired(false);
    }
  };

  if (loading && !reservations.length) {
    return <div className="text-center py-12">Loading reservations...</div>;
  }

  return (
    <div className="space-y-6">
      <AdminPageTitle 
        title="Manage Reservations" 
        description="View and manage all book reservations in the system"
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button onClick={fetchReservations} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={handleCheckExpiredReservations} 
            variant="outline" 
            size="sm"
            disabled={checkingExpired}
          >
            <Clock className="mr-2 h-4 w-4" />
            {checkingExpired ? 'Checking...' : 'Check Expired Reservations'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading reservations</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && reservations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reservations Found</h3>
            <p className="text-muted-foreground">
              There are currently no book reservations in the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Reservations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Reserved At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.user.name}</div>
                        <div className="text-xs text-muted-foreground">{reservation.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-8 overflow-hidden rounded">
                          <img 
                            src={reservation.book.coverImage || reservation.book.image || reservation.book.imagePath || 'https://placehold.co/400x600?text=No+Cover'} 
                            alt={reservation.book.title} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{reservation.book.title}</div>
                          <div className="text-xs text-muted-foreground">{reservation.book.author}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(reservation.reservedAt)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reservation.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : reservation.status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {reservation.status === 'active' && (
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
                      )}
                      {reservation.status !== 'active' && (
                        <span className="text-muted-foreground text-sm">
                          {formatDate(reservation.expiresAt)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {reservation.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancellingId === reservation._id}
                          onClick={() => handleCancelReservation(reservation._id)}
                        >
                          {cancellingId === reservation._id ? (
                            'Cancelling...'
                          ) : (
                            <>
                              <X className="mr-1 h-4 w-4" />
                              Cancel
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* <Card>
        <CardHeader>
          <CardTitle>Reservation Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <Clock className="h-5 w-5 mr-2 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium">24-Hour Reservation Period</h3>
                <p className="text-muted-foreground">
                  Books are reserved for 24 hours only. After this period, reservations expire automatically.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <RefreshCw className="h-5 w-5 mr-2 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium">Automatic Expiration</h3>
                <p className="text-muted-foreground">
                  The system checks for expired reservations whenever you click the "Check Expired Reservations" button.
                  Consider setting up a scheduled task to automatically check for expired reservations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default ManageReservationsPage; 