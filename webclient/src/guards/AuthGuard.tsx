import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthStorage from '../utils/AuthStorage';

interface JwtPayload {
    exp: number;
}

const AuthGuard = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const validateToken = () => {
            const accessToken = AuthStorage.getAccessToken();
            if (!accessToken) {
                setIsAuthenticated(false);
                navigate('/login', { replace: true });
                return;
            }

            try {
                const decoded: JwtPayload = jwtDecode(accessToken);
                const currentTime = Math.floor(Date.now() / 1000);

                if (decoded.exp < currentTime) {
                    AuthStorage.clearTokens();
                    setIsAuthenticated(false);
                    navigate('/login', { replace: true });
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Invalid token', error);
                AuthStorage.clearTokens();
                setIsAuthenticated(false);
                navigate('/login', { replace: true });
            }
        };

        validateToken();
    }, [navigate]);

    return <>{isAuthenticated && children}</>;
};

export default AuthGuard;
