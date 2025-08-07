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
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              JWT autentifikatsiya orqali xavfsiz kirish
            </p>
          </div>
        </Card>

        {/* Right Side - Features */}
        <div className="hidden lg:block">
          <div className="text-center lg:text-left">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-8 shadow-xl">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              OlmosCRM - 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {' '}Lead Boshqaruvi
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Mijozlaringizni professional darajada boshqaring. 
              Kanban board'lar, real-time yangilanishlar va zamonaviy interfeys.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead Boshqaruvi</h3>
                  <p className="text-gray-600">
                    Mijoz ma'lumotlarini to'liq boshqaring va ularning holatini kuzating
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Xavfsizlik</h3>
                  <p className="text-gray-600">
                    JWT token asosida xavfsiz autentifikatsiya va ma'lumotlaringiz himoyalangan
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ish Maydonlari</h3>
                  <p className="text-gray-600">
                    Ko'p ish maydonlarini boshqaring va har birida alohida board'lar yarating
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};