import { InformationCircleIcon } from '@heroicons/react/24/outline';

const ComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <InformationCircleIcon className="w-16 h-16 text-blue-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        ¡Estamos trabajando en esto!
      </h1>
      <p className="text-lg text-gray-600 text-center">
        Esta página está en desarrollo. La funcionalidad estará disponible próximamente.
      </p>
    </div>
  );
};

export default ComingSoon;