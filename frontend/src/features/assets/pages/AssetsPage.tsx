// src/features/assets/pages/AssetsPage.tsx
import { useState } from 'react';
import { Building, Car, TrendingUp, Gem, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText } from '@/core/components/atomic/CurrencyText';

interface Asset {
  id: string;
  name: string;
  type: 'property' | 'vehicle' | 'investment' | 'precious_metal' | 'other';
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  currency: string;
}

const assetTypeIcons = {
  property: Building,
  vehicle: Car,
  investment: TrendingUp,
  precious_metal: Gem,
  other: TrendingUp,
};

const assetTypeColors = {
  property: 'bg-blue-100 text-blue-600',
  vehicle: 'bg-green-100 text-green-600',
  investment: 'bg-purple-100 text-purple-600',
  precious_metal: 'bg-yellow-100 text-yellow-600',
  other: 'bg-gray-100 text-gray-600',
};

export const AssetsPage = () => {
  const { t } = useTranslation();
  const [assets] = useState<Asset[]>([]);

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalGain = assets.reduce(
    (sum, asset) => sum + (asset.currentValue - asset.purchaseValue),
    0
  );

  return (
    <div className="p-8">
      <PageHeader
        title={t('assets.title')}
        subtitle={t('assets.subtitle')}
        actions={
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            {t('assets.addAsset')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="elevated">
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-1">{t('assets.totalValue')}</p>
            <h3 className="text-2xl font-bold text-gray-900">
              <CurrencyText value={totalValue} />
            </h3>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-1">{t('assets.totalGain')}</p>
            <h3 className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <CurrencyText value={totalGain} showSign />
            </h3>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-1">{t('assets.assetCount')}</p>
            <h3 className="text-2xl font-bold text-gray-900">{assets.length}</h3>
          </CardBody>
        </Card>
      </div>

      {/* Assets List */}
      <Card variant="bordered">
        <CardHeader
          title={t('assets.yourAssets')}
          subtitle={t('assets.manageAssets')}
        />
        <CardBody>
          {assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => {
                const Icon = assetTypeIcons[asset.type];
                const colorClass = assetTypeColors[asset.type];
                const gain = asset.currentValue - asset.purchaseValue;
                const gainPercent = (gain / asset.purchaseValue) * 100;

                return (
                  <div
                    key={asset.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={gain >= 0 ? 'success' : 'danger'}>
                        {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{asset.name}</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      <CurrencyText value={asset.currentValue} currency={asset.currency as any} />
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('assets.purchased')}: <CurrencyText value={asset.purchaseValue} currency={asset.currency as any} />
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('assets.noAssetsYet')}</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                {t('assets.addFirstAsset')}
              </p>
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                {t('assets.addAsset')}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AssetsPage;
