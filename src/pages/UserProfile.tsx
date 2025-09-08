import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Mail, Calendar, Save, LogOut, Settings } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AuthUser } from '@/types/api';
import logger from '@/lib/logger';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        username: user.username,
        email: user.email
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const response = await apiClient.put('/api/auth/profile', formData);
      if (response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = response.data as { user: AuthUser };
        setProfile(userData.user);
        setIsEditing(false);
        logger.log('Profile updated successfully');
      }
    } catch (error) {
      logger.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-slate-200 dark:from-slate-900 dark:via-purple-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-pink-700 dark:text-pink-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-slate-200 dark:from-slate-900 dark:via-purple-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-pink-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">User Profile</h1>
            <p className="text-pink-100 text-sm">Manage your account settings</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <Card className="border-pink-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-pink-800 dark:text-pink-200 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="border-pink-200 focus:border-pink-400"
                  />
                ) : (
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p className="text-pink-800 dark:text-pink-200">{profile.username}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="border-pink-200 focus:border-pink-400"
                  />
                ) : (
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p className="text-pink-800 dark:text-pink-200">{profile.email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="text-pink-800 dark:text-pink-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Last Login</Label>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="text-pink-800 dark:text-pink-200 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    loadingText="Saving..."
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: profile.username,
                        email: profile.email
                      });
                    }}
                    className="border-pink-300 hover:bg-pink-50"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-pink-200/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-pink-800 dark:text-pink-200">Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
