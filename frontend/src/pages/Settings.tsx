import React, { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, LogOut, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Settings: React.FC = () => {
    const { profile, logout, refreshProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);

    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProfileLoading(true);
        try {
            await axios.put('http://localhost:5000/api/profile', { name, email }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            await refreshProfile();
            toast({ title: 'Success', description: 'Profile updated successfully' });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { error?: string } } };
            toast({ title: 'Error', description: apiErr.response?.data?.error || 'Failed to update profile', variant: 'destructive' });
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
        }
        setIsPasswordLoading(true);
        try {
            await axios.put('http://localhost:5000/api/profile/password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPasswords({ current: '', new: '', confirm: '' });
            toast({ title: 'Success', description: 'Password updated successfully' });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { error?: string } } };
            toast({ title: 'Error', description: apiErr.response?.data?.error || 'Failed to update password', variant: 'destructive' });
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setIsAvatarLoading(true);
        try {
            await axios.post('http://localhost:5000/api/profile/avatar', formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            await refreshProfile();
            toast({ title: 'Success', description: 'Profile picture updated' });
        } catch (_err: unknown) {
            toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
        } finally {
            setIsAvatarLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const avatarUrl = profile?.avatar_url
        ? `http://localhost:5000/${profile.avatar_url}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`;

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-10">
                <h1 className="text-2xl font-bold text-primary">Settings</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Section */}
                    <Card className="md:col-span-2 shadow-lg border-primary/10 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-xl text-primary flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-6 items-center mb-8 pb-6 border-b">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
                                        {isAvatarLoading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all scale-90 group-hover:scale-100"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h3 className="font-semibold text-lg">{profile?.name}</h3>
                                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                                    <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium uppercase tracking-wider">
                                        {profile?.role}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isProfileLoading} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                                    {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Quick Info / Log Out */}
                    <Card className="shadow-lg border-destructive/20 bg-gradient-to-b from-card to-destructive/5 overflow-hidden">
                        <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
                            <CardTitle className="text-xl text-destructive flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                Account Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Manage your account access and security settings.
                            </p>
                            <div className="pt-4 border-t">
                                <Button
                                    variant="destructive"
                                    className="w-full flex items-center gap-2"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" /> Log Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password Section */}
                    <Card className="md:col-span-2 shadow-lg border-primary/10 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-xl text-primary flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Lock className="h-5 w-5 text-primary" />
                                </div>
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current">Current Password</Label>
                                    <Input
                                        id="current"
                                        type="password"
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <Input
                                            id="new"
                                            type="password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Confirm New Password</Label>
                                        <Input
                                            id="confirm"
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isPasswordLoading} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                                    {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default Settings;
