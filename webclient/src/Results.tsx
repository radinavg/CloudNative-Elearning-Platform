'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, BarChart2, CheckCircle2, XCircle } from 'lucide-react';
import { apiConfig } from './config/apiConfig';
import axiosClient from './config/axiosClient';
import { toSuperscript } from './utils/formatDerivatives';

export default function ResultsPage() {
    const navigate = useNavigate();
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axiosClient.get(apiConfig.profileUrl);
                setResults(response.data);
            } catch (err) {
                setError('Error fetching results. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    const groupedResults = useMemo(() => {
        if (!results) return [];

        return Object.entries(results).map(([type, typeData]: [string, any]) => {
            return {
                type,
                results: typeData.exercises,
                ratio: typeData.ratio,
                grade: typeData.grade,
            };
        });
    }, [results]);

    if (loading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-8 flex items-center justify-center'>
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-8 flex items-center justify-center text-red-600'>
                {error}
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-8'>
            <div className='max-w-6xl mx-auto   overflow-hidden'>
                <Button
                    variant='ghost'
                    className='mb-4 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900'
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Dashboard
                </Button>
                <Card className='w-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-purple-500 overflow-hidden'>
                    <CardHeader>
                        <CardTitle className='text-2xl font-semibold text-gray-900 dark:text-white'>
                            Your Results
                        </CardTitle>
                        <CardDescription className='text-purple-600 dark:text-purple-400'>
                            Check your performance and grades for each exercise type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {groupedResults.map(({ type, results, ratio, grade }) => (
                            <div
                                key={type}
                                className='mb-8'
                            >
                                <h3 className='text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center'>
                                    <BarChart2 className='mr-2 h-5 w-5 text-purple-500' />
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </h3>
                                <div className='flex items-center mb-4'>
                                    <div className='text-lg font-medium text-gray-700 dark:text-gray-300'>
                                        Grade:{' '}
                                        <span className='text-xl text-purple-600 dark:text-purple-400'>
                                            {grade ? grade : '-'}
                                        </span>
                                    </div>
                                    <div className='ml-4 text-sm text-gray-500 dark:text-gray-400'>
                                        Correct answers: {Math.round(ratio * 100)}%
                                    </div>
                                </div>
                                <div className='rounded-md border max-h-[200px] overflow-y-auto'>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className='w-[40%]'>Question</TableHead>
                                                <TableHead className='w-[30%] text-center'>Your Answer</TableHead>
                                                <TableHead className='w-[30%] text-center'>Result</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((result: any) => (
                                                <TableRow key={result.id}>
                                                    <TableCell className='font-medium'>
                                                        {formatTask(result.exercise, type)}
                                                    </TableCell>
                                                    <TableCell className='text-center'>
                                                        {formatAnswer(result.answer, type)}
                                                    </TableCell>
                                                    <TableCell className='text-center'>
                                                        {result.correctness ? (
                                                            <div className='flex items-center justify-center text-green-600'>
                                                                <CheckCircle2 className='mr-2 h-4 w-4' />
                                                                Correct
                                                            </div>
                                                        ) : (
                                                            <div className='flex items-center justify-center text-red-600'>
                                                                <XCircle className='mr-2 h-4 w-4' />
                                                                Incorrect
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function formatTask(exercise: any, type: string) {
    switch (type.toLowerCase()) {
        case 'addition':
            return exercise.addends.join(' + ');
        case 'multiplication':
            return exercise.multipliers.join(' × ');
        case 'derivatives':
            return `${formatPolynomial(exercise.coeffs, exercise.power)}`;
        default:
            return 'Unknown question type';
    }
}

function formatPolynomial(coeffs: number[], power: number) {
    return coeffs
        .map((coeff, index) => {
            if (coeff === 0) return '';
            const exponent = power - index;
            if (exponent === 0) return coeff.toString();
            if (exponent === 1) return `${coeff}x`;
            return `${coeff}x${toSuperscript(exponent)}`;
        })
        .filter(Boolean)
        .join(' + ');
}

function formatAnswer(answer: any, type: string) {
    if (type.toLowerCase() === 'derivatives') {
        let parsedAnswer;
        try {
            parsedAnswer = JSON.parse(answer);
        } catch (e) {
            console.error('Failed to parse answer:', e);
            return answer.toString();
        }
        return formatDerivative(parsedAnswer.coeffs, parsedAnswer.power);
    }
    return answer.toString();
}

function formatDerivative(coeffs: number[], power: number) {
    if (coeffs.length === 0) return '0';
    return (
        coeffs
            .map((coeff, index) => {
                if (coeff === 0) return '';
                const exponent = power - index;
                if (exponent === 0) return coeff;
                if (exponent === 1) return `${coeff}x`;
                return `${coeff}x${toSuperscript(exponent)}`;
            })
            .filter(Boolean)
            .join(' + ') || '0'
    );
}
