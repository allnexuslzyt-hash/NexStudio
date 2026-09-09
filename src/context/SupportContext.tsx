import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { SupportTicket, TicketMessage, TicketPriority } from '../types';

interface SupportContextType {
  tickets: SupportTicket[];
  userTickets: SupportTicket[];
  activeTicket: SupportTicket | null;
  activeTicketId: string | null;
  isSupportModalOpen: boolean;
  isLoading: boolean;
  openSupportModal: (ticketId?: string) => void;
  closeSupportModal: () => void;
  setActiveTicketId: (ticketId: string | null) => void;
  createTicket: (data: {
    subject: string;
    contactEmail: string;
    priority: TicketPriority;
    initialMessage: string;
  }) => Promise<SupportTicket>;
  addMessageToTicket: (ticketId: string, text: string) => Promise<void>;
  claimTicket: (ticketId: string) => Promise<void>;
  closeTicket: (ticketId: string) => Promise<void>;
  reopenTicket: (ticketId: string) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize tickets in real time from Firestore
  useEffect(() => {
    // If admin, listen to all tickets. If regular user and logged in, listen to user tickets
    const ticketsCollection = collection(db, 'support_tickets');
    let q = query(ticketsCollection);

    if (!isAdmin && user) {
      q = query(ticketsCollection, where('userId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTickets: SupportTicket[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTickets.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<SupportTicket, 'id'>)
          });
        });

        // Sort by updatedAt descending
        fetchedTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setTickets(fetchedTickets);
      },
      (error) => {
        console.warn('Error escuchando tickets de soporte:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Derived user tickets
  const userTickets = React.useMemo(() => {
    if (!user) return tickets;
    return tickets.filter(
      (t) => t.userId === user.uid || (user.email && t.contactEmail.toLowerCase() === user.email.toLowerCase())
    );
  }, [tickets, user]);

  const activeTicket = React.useMemo(() => {
    if (!activeTicketId) return null;
    return tickets.find((t) => t.id === activeTicketId) || null;
  }, [tickets, activeTicketId]);

  const openSupportModal = (ticketId?: string) => {
    if (ticketId) {
      setActiveTicketId(ticketId);
    }
    setIsSupportModalOpen(true);
  };

  const closeSupportModal = () => {
    setIsSupportModalOpen(false);
  };

  // Create a new support ticket
  const createTicket = async (data: {
    subject: string;
    contactEmail: string;
    priority: TicketPriority;
    initialMessage: string;
  }): Promise<SupportTicket> => {
    setIsLoading(true);
    const ticketId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const senderName = profile?.displayName || user?.displayName || data.contactEmail.split('@')[0];
    const senderAvatar = profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${ticketId}`;

    const initialMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.uid || 'anonymous',
      senderEmail: data.contactEmail,
      senderName,
      senderAvatar,
      isAdmin: false,
      text: data.initialMessage.trim(),
      timestamp: nowIso
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      subject: data.subject.trim(),
      contactEmail: data.contactEmail.trim().toLowerCase(),
      priority: data.priority,
      status: 'abierto',
      userId: user?.uid,
      userName: senderName,
      userAvatar: senderAvatar,
      createdAt: nowIso,
      updatedAt: nowIso,
      claimedBy: null,
      claimedByName: null,
      claimedByEmail: null,
      messages: [initialMsg]
    };

    try {
      const docRef = doc(db, 'support_tickets', ticketId);
      await setDoc(docRef, newTicket);
      setActiveTicketId(ticketId);
      return newTicket;
    } catch (err) {
      console.error('Error al crear ticket de soporte:', err);
      handleFirestoreError(err, OperationType.CREATE, `support_tickets/${ticketId}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Send message inside a ticket
  const addMessageToTicket = async (ticketId: string, text: string) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket || !text.trim()) return;

    const nowIso = new Date().toISOString();
    const senderName = profile?.displayName || user?.displayName || (isAdmin ? 'Soporte NexStudio' : 'Usuario');
    const senderAvatar = profile?.photoURL || user?.photoURL;

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      senderId: user?.uid || 'guest',
      senderEmail: user?.email || targetTicket.contactEmail,
      senderName,
      senderAvatar,
      isAdmin,
      text: text.trim(),
      timestamp: nowIso
    };

    const updatedTicket: SupportTicket = {
      ...targetTicket,
      updatedAt: nowIso,
      messages: [...(targetTicket.messages || []), newMsg]
    };

    try {
      await setDoc(doc(db, 'support_tickets', ticketId), updatedTicket, { merge: true });
    } catch (err) {
      console.error('Error enviando mensaje en ticket:', err);
      handleFirestoreError(err, OperationType.UPDATE, `support_tickets/${ticketId}`);
      throw err;
    }
  };

  // Claim ticket (Admin only)
  const claimTicket = async (ticketId: string) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const nowIso = new Date().toISOString();
    const adminName = profile?.displayName || user?.displayName || 'Nexus Admin';

    const updatedTicket: Partial<SupportTicket> = {
      claimedBy: user?.uid || 'admin',
      claimedByName: adminName,
      claimedByEmail: user?.email || 'allnexuslzyt@gmail.com',
      status: 'en_proceso',
      updatedAt: nowIso
    };

    try {
      await setDoc(doc(db, 'support_tickets', ticketId), updatedTicket, { merge: true });
    } catch (err) {
      console.error('Error reclamando ticket:', err);
      handleFirestoreError(err, OperationType.UPDATE, `support_tickets/${ticketId}`);
      throw err;
    }
  };

  // Close ticket
  const closeTicket = async (ticketId: string) => {
    const nowIso = new Date().toISOString();
    try {
      await setDoc(
        doc(db, 'support_tickets', ticketId),
        { status: 'cerrado', updatedAt: nowIso },
        { merge: true }
      );
    } catch (err) {
      console.error('Error cerrando ticket:', err);
      handleFirestoreError(err, OperationType.UPDATE, `support_tickets/${ticketId}`);
      throw err;
    }
  };

  // Reopen ticket
  const reopenTicket = async (ticketId: string) => {
    const nowIso = new Date().toISOString();
    try {
      await setDoc(
        doc(db, 'support_tickets', ticketId),
        { status: 'en_proceso', updatedAt: nowIso },
        { merge: true }
      );
    } catch (err) {
      console.error('Error reabriendo ticket:', err);
      handleFirestoreError(err, OperationType.UPDATE, `support_tickets/${ticketId}`);
      throw err;
    }
  };

  // Delete ticket (Admin only)
  const deleteTicket = async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, 'support_tickets', ticketId));
      if (activeTicketId === ticketId) {
        setActiveTicketId(null);
      }
    } catch (err) {
      console.error('Error eliminando ticket:', err);
      handleFirestoreError(err, OperationType.DELETE, `support_tickets/${ticketId}`);
      throw err;
    }
  };

  return (
    <SupportContext.Provider
      value={{
        tickets,
        userTickets,
        activeTicket,
        activeTicketId,
        isSupportModalOpen,
        isLoading,
        openSupportModal,
        closeSupportModal,
        setActiveTicketId,
        createTicket,
        addMessageToTicket,
        claimTicket,
        closeTicket,
        reopenTicket,
        deleteTicket
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport debe ser usado dentro de un SupportProvider');
  }
  return context;
};
