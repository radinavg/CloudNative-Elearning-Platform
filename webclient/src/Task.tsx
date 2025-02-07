'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Percent, PlusCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from './config/axiosClient';
import { apiConfig } from './config/apiConfig';
import { toSuperscript } from './utils/formatDerivatives';
import { useToast } from "./components/ui/ToastProvider";

interface AdditionTask {
    type: 'addition';
    addends: number[];
    id: string;
}

interface MultiplicationTask {
    type: 'multiplication';
    multipliers: number[];
    id: string;
}

interface DerivativeTask {
    type: 'derivative';
    coeffs: number[];
    power: number;
    id: string;
}

type TaskDto = AdditionTask | MultiplicationTask | DerivativeTask;

const taskIcons = {
    addition: <PlusCircle className='h-6 w-6' />,
    multiplication: <XCircle className='h-6 w-6' />,
    derivatives: <Percent className='h-6 w-6' />,
};

/**
 * Formats a polynomial (descending powers).
 */
function formatPolynomial(coeffs: number[]): string {
    const degree = coeffs.length - 1;
    return coeffs
        .map((coeff, i) => {
            const power = degree - i;
            if (power === 0) return `${coeff}`;
            if (power === 1) return `${coeff}x`;
            return `${coeff}x${toSuperscript(power)}`;
        })
        .join(' + ');
}

function parsePolynomial(polyStr: string): { coeffs: number[]; power: number } {
    const terms = polyStr.replace(/\s+/g, '').split('+');
    let maxPower = 0;
    const coeffMap: Record<number, number> = {};

    for (const term of terms) {
        if (term.includes('x^')) {
            const [coeffStr, powStr] = term.split('x^');
            const coeff = coeffStr ? parseFloat(coeffStr) : 1;
            const power = parseInt(powStr, 10);
            coeffMap[power] = coeff;
            if (power > maxPower) maxPower = power;
        } else if (term.includes('x')) {
            const [coeffStr] = term.split('x');
            const coeff = coeffStr ? parseFloat(coeffStr) : 1;
            coeffMap[1] = coeff;
            if (1 > maxPower) maxPower = 1;
        } else {
            const coeff = parseFloat(term);
            coeffMap[0] = coeff;
        }
    }

    const coeffs: number[] = [];
    for (let i = maxPower; i >= 0; i--) {
        coeffs.push(coeffMap[i] || 0);
    }

    return { coeffs, power: maxPower };
}

export default function TaskPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [taskType, setTaskType] = useState<keyof typeof taskIcons>('addition');
    const [task, setTask] = useState<TaskDto | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const type = searchParams.get('type');
        if (type && type in taskIcons) {
            setTaskType(type as keyof typeof taskIcons);
            fetchTask(type as keyof typeof taskIcons);
        }
    }, [searchParams, navigate]);

    const fetchTask = async (type: keyof typeof taskIcons) => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`${apiConfig.exerciseUrl}/${type}`);
            const data = response.data;
            setTask({
                ...data.exercise,
                id: data.id,
            });
            setUserAnswer('');
            setLoading(false);
        } catch (error) {
            console.error('Error fetching task:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatQuestion = () => {
        if (!task) return '';
        switch (task.type) {
            case 'addition':
                return `${task.addends.join(' + ')} = ?`;
            case 'multiplication':
                return `${task.multipliers.join(' × ')} = ?`;
            case 'derivative':
                return `${formatPolynomial(task.coeffs)} = ?`;
            default:
                return '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;
    
        try {
            const bodyPayload: any = {
                eid: task.id,
            };
    
            if (task.type === 'derivative') {
                const { coeffs, power } = parsePolynomial(userAnswer);
                bodyPayload.solution = { coeffs, power };
                bodyPayload.coeffs = task.coeffs;
                bodyPayload.power = task.power;
            } else {
                bodyPayload.solution = Number(userAnswer);
                if (task.type === 'addition') {
                    bodyPayload.addends = task.addends;
                } else if (task.type === 'multiplication') {
                    bodyPayload.multipliers = task.multipliers;
                }
            }
            setLoading(true);
            setSubmitting(true);
            await axiosClient.post(`${apiConfig.exerciseUrl}/${taskType}`, bodyPayload);
            //TODO:
            await sleep(1000);
            setSubmitting(false);
            fetchTask(taskType);
        } catch (error) {
            console.error('Error submitting answer:', error);
            addToast("There was an error submitting your answer.", "error");
        }
    };
    

    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-8'>
            <div className='max-w-2xl mx-auto'>
                <Button
                    variant='ghost'
                    className='mb-4 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900'
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to Dashboard
                </Button>
                <Card className='w-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-indigo-500'>
                    <CardHeader>
                        <CardTitle className='text-2xl font-semibold text-gray-900 dark:text-white flex items-center'>
                            {taskIcons[taskType]}
                            <span className='ml-2'>{taskType.charAt(0).toUpperCase() + taskType.slice(1)} Task</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className='text-center text-gray-500'>Loading...</p>
                        ) : (
                            <motion.div
                                key={taskType}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p className='text-xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-200'>
                                    {formatQuestion()}
                                </p>
                                <form onSubmit={handleSubmit}>
                                    <div className='space-y-4'>
                                        <div>
                                            <Label
                                                htmlFor='answer'
                                                className='text-sm font-medium text-gray-700 dark:text-gray-300'
                                            >
                                                Your Answer
                                            </Label>
                                            <Input
                                                id='answer'
                                                type='text'
                                                placeholder={'Enter your answer'}
                                                value={userAnswer}
                                                onChange={(e) => setUserAnswer(e.target.value)}
                                                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'
                                                disabled={loading || submitting}
                                            />
                                            {task?.type === 'derivative' && (
                                                <p className='text-sm mt-2 text-gray-500'>
                                                    <span className='font-bold'>Note:</span> Your answer must be in this
                                                    format:{' '}
                                                    <span className='text-indigo-500 font-semibold'>
                                                        3x^3 + 2x^2 + 5x
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            type='submit'
                                            className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200'
                                            disabled={submitting || loading || userAnswer.trim() === ''}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit Answer'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </CardContent>
                    <CardFooter />
                </Card>
            </div>
        </div>
    );
}
