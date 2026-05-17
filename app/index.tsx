import React from 'react';
import { Redirect } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isLoading: appLoading, userProfile } = useAppContext();
  const { isGuest, isLoading: authLoading, user, userRole, activeProfile, hasBothRoles, userRoles } = useAuth();
  const isLoading = appLoading || authLoading;

  if (isLoading) return null;

  // AUTO TUTORIAL TRIGGER
  if (userProfile && !userProfile.has_seen_tutorial) {
    return <Redirect href="/tutorial" />;
  }

  if (!user && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }

  // Handle Multi-role users, Guests, and New users with no roles yet
  if (isGuest || hasBothRoles || (user && userRoles.length === 0)) {
    if (!activeProfile) {
      return <Redirect href="/profile-selection" />;
    }
    return <Redirect href={activeProfile === 'shopkeeper' ? "/(shopkeeper)" : "/personal-dashboard"} />;
  }

  // Single role redirection for registered users
  if (userRole === 'shopkeeper') {
    return <Redirect href="/(shopkeeper)" />;
  }

  return <Redirect href="/personal-dashboard" />;
}


