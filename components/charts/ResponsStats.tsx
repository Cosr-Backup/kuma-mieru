import { Tooltip as HeroUITooltip } from '@heroui/react';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface ResponsStatsProps {
  value: number;
  fill: string;
  isHome?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ResponsStats({ value, fill, isHome, size = 'md' }: ResponsStatsProps) {
  const data = [{ value, fill }];
  const t = useTranslations('node');

  const tooltipContent = !isHome ? (
    <div className="flex flex-col gap-2">
      <span className="text-md text-gray-500">
        {t('uptimeStatus')}: {value.toFixed(2)}%
      </span>
    </div>
  ) : (
    `${t('uptimeStatus')}: ${value.toFixed(2)}%`
  );

  const chartSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <HeroUITooltip
      content={tooltipContent}
      placement="left"
      delay={0}
      closeDelay={0}
      motionProps={{
        variants: {
          exit: {
            opacity: 0,
            transition: {
              duration: 0.1,
              ease: 'easeOut',
            },
          },
          enter: {
            opacity: 1,
            transition: {
              duration: 0.15,
              ease: 'easeOut',
            },
          },
        },
      }}
    >
      <div className={clsx('inline-flex items-center', !isHome ? 'gap-2' : 'gap-1')}>
        <div className={chartSize}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={-270}
              barSize={size === 'sm' ? 6 : size === 'lg' ? 14 : 12}
              cx="50%"
              cy="50%"
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={30} fill={fill} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <span className={`${textSize} text-gray-500`}>{value.toFixed(2)}%</span>
      </div>
    </HeroUITooltip>
  );
}
