import React from 'react';
import ProfileContent from './ProfileContent';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  
  return (
    <ProfileContent 
      user={user || null} 
      onLogout={logout} 
      isPrototype={false} 
    />
  );
}
