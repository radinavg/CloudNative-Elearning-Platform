import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthStorage from '@/utils/AuthStorage';
import { apiConfig } from '@/config/apiConfig';
import axiosClient from './config/axiosClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!email || !password) {
            setError('All fields are required');
            setIsSubmitting(false);
            return;
        }

        try {
            // API call to login
            const loginResponse = await axiosClient.post(apiConfig.loginUrl, { email, password });
            const { AccessToken, IdToken, RefreshToken } = (await loginResponse.data).AuthenticationResult;

            AuthStorage.saveTokens(AccessToken, IdToken, RefreshToken);

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4'>
            <Card className='w-full max-w-md shadow-xl'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400'>
                        Welcome Back
                    </CardTitle>
                    <CardDescription className='text-center text-indigo-600/80 dark:text-indigo-400/80'>
                        Sign in to access the E-Learning platform!
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className='space-y-4'>
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
                                placeholder='Your email'
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
                                placeholder='Your password'
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
                            className='w-full text-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white 
                            dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200'
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Logging in...' : 'Log in'}
                        </Button>
                        <div className='text-sm text-center text-gray-600 dark:text-gray-400'>
                            Don't have an account?{' '}
                            <Link
                                to='/register'
                                className='text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium'
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
