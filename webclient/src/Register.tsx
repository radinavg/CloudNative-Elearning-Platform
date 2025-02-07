import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from "./components/ui/ToastProvider";

// Assuming apiConfig is defined in a separate file
import { apiConfig } from '@/config/apiConfig';
import axiosClient from './config/axiosClient';

export default function Register() {
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const navigate = useNavigate();

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setProfilePic(file);
            setProfilePicPreview(URL.createObjectURL(file));
        } else {
            setProfilePic(null);
            setProfilePicPreview(null);
        }
    };

    const getInitials = () => {
        const fInitial = firstName.trim().charAt(0).toUpperCase() || '';
        const lInitial = lastName.trim().charAt(0).toUpperCase() || '';
        const initials = (fInitial + lInitial).trim();
        return initials;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!firstName || !lastName || !password) {
            setError('All fields are required');
            setIsSubmitting(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setIsSubmitting(false);
            return;
        }

        try {
            // Register the user
            const registerResponse = await axiosClient.post(apiConfig.registerUrl, {
                email,
                firstName,
                lastName,
                password,
            });
            const userSub = (await registerResponse.data).UserSub;
            if (!userSub) throw new Error('Could not create User. Perhaps already exists? Please try again.');
            // Upload the profile picture to S3
            if (profilePic) {
                const filename = `${userSub}`;

                await axiosClient.put(`${apiConfig.s3BucketUrl}/${filename}`, profilePic, {
                    headers: {
                        'Content-Type': profilePic.type,
                    },
                });
            }
            console.log('User registered successfully:', userSub);
            addToast("You have been successfully registered.", "success");
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4'>
            <Card className='w-full max-w-md shadow-xl'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400'>
                        Create an Account
                    </CardTitle>
                    <CardDescription className='text-center text-indigo-600/80 dark:text-indigo-400/80'>
                        Sign up to get started with our E-Learning service.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className='space-y-4'>
                        <div className='space-y-2'>
                            <Label
                                htmlFor='profilePicture'
                                className='text-sm font-medium text-gray-700 dark:text-gray-300'
                            >
                                Profile Picture (optional)
                            </Label>
                            <div className='flex items-center space-x-4'>
                                <Avatar className='h-16 w-16 ring-2 ring-indigo-400 dark:ring-indigo-600'>
                                    {profilePicPreview ? (
                                        <AvatarImage
                                            src={profilePicPreview}
                                            alt='Profile Preview'
                                        />
                                    ) : (
                                        <AvatarFallback className='bg-indigo-200 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-200'>
                                            {getInitials()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <Input
                                    id='profilePicture'
                                    type='file'
                                    accept='image/*'
                                    onChange={handleProfilePicChange}
                                    className='flex-1'
                                />
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label
                                    htmlFor='firstName'
                                    className='text-sm font-medium text-gray-700 dark:text-gray-300'
                                >
                                    First Name
                                </Label>
                                <Input
                                    id='firstName'
                                    placeholder='John'
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className='w-full'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label
                                    htmlFor='lastName'
                                    className='text-sm font-medium text-gray-700 dark:text-gray-300'
                                >
                                    Last Name
                                </Label>
                                <Input
                                    id='lastName'
                                    placeholder='Doe'
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className='w-full'
                                />
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <Label
                                htmlFor='email'
                                className='text-sm font-medium text-gray-700 dark:text-gray-300'
                            >
                                Email
                            </Label>
                            <Input
                                id='email'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className='w-full'
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label
                                htmlFor='password'
                                className='text-sm font-medium text-gray-700 dark:text-gray-300'
                            >
                                Password
                            </Label>
                            <Input
                                id='password'
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className='w-full'
                            />
                        </div>

                        {error && (
                            <div
                                className='flex items-center text-red-500 text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-md'
                                role='alert'
                            >
                                <AlertCircle className='w-4 h-4 mr-2' />
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className='flex flex-col space-y-4'>
                        <Button
                            type='submit'
                            className='w-full text-lg font-medium bg-indigo-600 hover:bg-indigo-700 
                            text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 
                            transition-colors duration-200'
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Registering...' : 'Register'}
                        </Button>
                        <div className='text-sm text-center text-gray-600 dark:text-gray-400'>
                            Already have an account?{' '}
                            <Link
                                to='/login'
                                className='text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium'
                            >
                                Log in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
