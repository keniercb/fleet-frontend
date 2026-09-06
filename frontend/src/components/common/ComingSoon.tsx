interface ComingSoonProps {
  title: string;
}

import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ComingSoon({ title }: ComingSoonProps) {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-center max-w-md">
        {t('comingSoon.message')}
      </p>
    </div>
  );
}