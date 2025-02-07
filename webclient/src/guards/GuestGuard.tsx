import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthStorage from '../utils/AuthStorage';

interface JwtPayload {
    exp: number;
}

const GuestGuard = ({ children }: { children: ReactNode }) => {
    const [isGuest, setIsGuest] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const validateGuest = () => {
            const accessToken = AuthStorage.getAccessToken();
            if (!accessToken) {
                setIsGuest(true);
                return;
            }

            try {
                const decoded: JwtPayload = jwtDecode(accessToken);
                const currentTime = Math.floor(Date.now() / 1000);

                if (decoded.exp < currentTime) {
                    AuthStorage.clearTokens();
                    setIsGuest(true);
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } catch (error) {
                console.error('Invalid token', error);
                AuthStorage.clearTokens();
                setIsGuest(true);
            }
        };

        validateGuest();
    }, [navigate]);

    return <>{isGuest && children}</>;
};

export default GuestGuard;
