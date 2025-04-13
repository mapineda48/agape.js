import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { user } from '@agape/access';

console.log(user);

const WelcomeUser = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <FaceSmileIcon className="w-16 h-16 text-blue-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        ¡Bienvenido{user ? `, ${user.fullName}` : ''}!
      </h1>
      <p className="text-lg text-gray-600 text-center">
        Nos alegra verte aquí. Explora tu panel y descubre todo lo que hemos preparado para ti.
      </p>
    </div>
  );
};

export default WelcomeUser;
