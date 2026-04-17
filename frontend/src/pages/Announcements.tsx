import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Trash2, PlusCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAnnouncements, useAddAnnouncement, useDeleteAnnouncement } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types/project';

const Announcements: React.FC = () => {
    const { data: announcements, isLoading } = useAnnouncements();
    const addAnnouncement = useAddAnnouncement();
    const deleteAnnouncement = useDeleteAnnouncement();
    const { profile } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info' });

    const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin';

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await addAnnouncement.mutateAsync(newAnnouncement);
        setNewAnnouncement({ title: '', content: '', type: 'info' });
        setIsAdding(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'important': return <AlertCircle className="h-5 w-5 text-destructive" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
            default: return <Info className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-primary">Announcements</h1>
                    {isAdmin && (
                        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {isAdding ? 'Cancel' : 'New Announcement'}
                        </Button>
                    )}
                </div>

                {isAdding && (
                    <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <CardHeader>
                            <CardTitle className="text-sm">Create New Announcement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <Input
                                    placeholder="Title"
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    required
                                />
                                <Textarea
                                    placeholder="Content"
                                    value={newAnnouncement.content}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    required
                                />
                                <div className="flex gap-2">
                                    {(['info', 'warning', 'important'] as const).map(type => (
                                        <Button
                                            key={type}
                                            type="button"
                                            variant={newAnnouncement.type === type ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setNewAnnouncement({ ...newAnnouncement, type })}
                                            className="capitalize"
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                                <Button type="submit" className="w-full" disabled={addAnnouncement.isPending}>
                                    {addAnnouncement.isPending ? 'Posting...' : 'Post Announcement'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : announcements && announcements.length > 0 ? (
                    <div className="space-y-4">
                        {announcements.map((ann: Announcement) => (
                            <Card key={ann.id} className={cn(
                                "border-l-4",
                                ann.type === 'important' ? "border-l-destructive" : 
                                ann.type === 'warning' ? "border-l-warning" : "border-l-primary"
                            )}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="mt-1">{getTypeIcon(ann.type)}</div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-lg">{ann.title}</h3>
                                                <p className="text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
                                                <p className="text-xs text-muted-foreground mt-4">
                                                    Posted on {new Date(ann.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteAnnouncement.mutate(ann.id)}
                                                disabled={deleteAnnouncement.isPending}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No announcements at this time</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Check back later for important updates and notifications
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
};

export default Announcements;
