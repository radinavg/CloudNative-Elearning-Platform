'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
    BarChart2,
    BookOpen,
    LogOut,
    PenLineIcon,
    Percent,
    PlusCircle,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthStorage from './utils/AuthStorage';
import { apiConfig } from './config/apiConfig';
import axiosClient from './config/axiosClient';
import { useToast } from "./components/ui/ToastProvider";

const exerciseTypes = [
    { name: 'Addition', icon: <PlusCircle className='h-6 w-6' />, route: 'addition' },
    { name: 'Multiplication', icon: <XCircle className='h-6 w-6' />, route: 'multiplication' },
    { name: 'Derivatives', icon: <Percent className='h-6 w-6' />, route: 'derivatives' },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string | null>(null);
    const [lastName, setLastName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleLogout = () => {
        AuthStorage.clearTokens();
        navigate('/login');
    };

    const handleSolveExercise = (type: string) => {
        navigate(`/task?type=${type.toLowerCase()}`);
    };

    const handleViewResults = () => {
        navigate('/results');
    };

    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const idToken = AuthStorage.getIdToken();

                const decodedToken = AuthStorage.decodeJwt(idToken!);

                // Extract claims
                setFirstName(decodedToken!['given_name'] || 'User');
                setLastName(decodedToken!['family_name'] || '');
                setEmail(decodedToken!['email'] || '');

                const fileUrl = `${apiConfig.s3BucketUrl}/${decodedToken!.sub}`;
                const response = await axiosClient.get(fileUrl, {
                    responseType: 'blob',
                });
                const imageUrl = URL.createObjectURL(response.data);
                setProfilePicture(imageUrl);
            } catch (error) {
                
            }
        };

        loadUserInfo();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const userSub = AuthStorage.getSub();
        if (!userSub) {
            addToast("User is not authenticated.", "error");
            handleLogout();
            return;
        }

        try {
            await axiosClient.put(`${apiConfig.s3BucketUrl}/${userSub}`, file, {
                headers: {
                    'Content-Type': file.type,
                },
            });

            const idToken = AuthStorage.getIdToken();

            const decodedToken = AuthStorage.decodeJwt(idToken!);

            const fileUrl = `${apiConfig.s3BucketUrl}/${decodedToken!.sub}`;
            const response = await axiosClient.get(fileUrl, {
                responseType: 'blob',
            });
            const imageUrl = URL.createObjectURL(response.data);
            setProfilePicture(imageUrl);
            addToast("Your profile picture has been successfully changed.", "success");
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            addToast("An error occurred while uploading the profile picture.", "error");
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950'>
            <header className='bg-white dark:bg-gray-800 shadow-md'>
                <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
                    <div className='flex justify-between items-center'>
                        <h1 className='text-3xl font-bold text-indigo-600 dark:text-indigo-400'>
                            E-Learning Dashboard
                        </h1>

                        <div className='flex items-center space-x-4'>
                            <div className='relative'>
                                <Avatar className='h-12 w-12 ring-2 ring-indigo-400 dark:ring-indigo-600'>
                                    <AvatarImage
                                        src={profilePicture || '/placeholder.svg'}
                                        alt={`${firstName} ${lastName}`}
                                    />
                                    <AvatarFallback className='bg-indigo-200 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-200'>
                                        {firstName ? firstName[0] : 'U'}
                                        {lastName ? lastName[0] : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <label className='absolute -bottom-1 -right-1 cursor-pointer'>
                                    <div className='bg-indigo-500 hover:bg-indigo-600 rounded-full p-1.5 text-white shadow-lg transition-colors duration-200'>
                                        <PenLineIcon className='h-3 w-3' />
                                    </div>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        onChange={handleFileChange}
                                        className='sr-only'
                                    />
                                </label>
                            </div>
                            <div className='hidden md:block'>
                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                    {firstName} {lastName}
                                </p>
                                <p className='text-xs text-indigo-600 dark:text-indigo-400'>{email}</p>
                            </div>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleLogout}
                                className='text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors duration-200'
                            >
                                <LogOut className='h-5 w-5' />
                                <span className='sr-only'>Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>
            <main className='w-4/6 max-w-full mx-auto py-12 px-4 sm:px-6 lg:px-8'>
                <div className='grid grid-cols-1 gap-8'>
                    <Card className='w-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-x-2 border-b-2 border-indigo-500'>
                        <CardHeader>
                            <CardTitle className='text-2xl font-semibold text-gray-900 dark:text-white flex items-center'>
                                <BookOpen className='h-6 w-6 mr-2 text-indigo-500' />
                                Solve Exercises
                            </CardTitle>
                            <CardDescription className='text-indigo-600 dark:text-indigo-400'>
                                Practice your skills with various exercise types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                                {exerciseTypes.map((type) => (
                                    <motion.div
                                        key={type.name}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Button
                                            onClick={() => handleSolveExercise(type.route)}
                                            className='w-full h-24 text-lg font-medium bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-100 border-none transition-colors duration-200'
                                        >
                                            {type.icon}
                                            <span className='ml-2'>{type.name}</span>
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='w-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-x-2 border-b-2 border-purple-500'>
                        <CardHeader>
                            <CardTitle className='text-2xl font-semibold text-gray-900 dark:text-white flex items-center'>
                                <BarChart2 className='h-6 w-6 mr-2 text-purple-500' />
                                Your Results
                            </CardTitle>
                            <CardDescription className='text-purple-600 dark:text-purple-400'>
                                Check your performance and grades
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    onClick={handleViewResults}
                                    className='w-full h-24 text-lg font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100 border-none transition-colors duration-200'
                                >
                                    <BarChart2 className='h-6 w-6 mr-2' />
                                    View Results
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
