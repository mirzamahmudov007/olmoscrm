import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn, Building2, Shield, Users } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LoginCredentials } from '../types';
import { handleApiError } from '../services/api';
import { ROUTES } from '../config/constants';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || ROUTES.WORKSPACES;
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();
  
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      const user = authService.getUser();
      if (user) {
        login(user);
        toast.success('Muvaffaqiyatli kirildi! 🎉');
        navigate(from, { replace: true });
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
        {/* Left Side - Login Form */}
        <Card variant="glass" className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Xush Kelibsiz!</h1>
            <p className="text-gray-600 text-lg">OlmosCRM hisobingizga kiring</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Foydalanuvchi nomi"
              type="text"
              placeholder="Foydalanuvchi nomingizni kiriting"
              error={errors.username?.message}
              {...register('username', { 
                required: 'Foydalanuvchi nomi talab qilinadi',
                minLength: {
                  value: 3,
                  message: 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak'
                }
              })}
            />

            <Input
              label="Parol"
              type="password"
              placeholder="Parolingizni kiriting"
              error={errors.password?.message}
              {...register('password', { 
                required: 'Parol talab qilinadi',
                minLength: {
                  value: 6,
                  message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
                }
              })}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Kirilmoqda...' : 'Tizimga Kirish'}
            </Button>
          </form>

        </Card>

    </div>
  );
};