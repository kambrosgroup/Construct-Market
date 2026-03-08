import React from 'react';
import { Badge } from './ui/badge';
import { 
  Shield, ShieldCheck, Award, Star, Building2, BadgeCheck, Crown, CheckCircle 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const BADGE_ICONS = {
  'shield-check': ShieldCheck,
  'award': Award,
  'shield': Shield,
  'star': Star,
  'building': Building2,
  'badge-check': BadgeCheck,
  'crown': Crown
};

const BADGE_COLORS = {
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200'
};

export function VerificationBadge({ badge, size = 'sm', showLabel = false }) {
  const Icon = BADGE_ICONS[badge.icon] || CheckCircle;
  const colorClass = BADGE_COLORS[badge.color] || 'bg-gray-100 text-gray-700';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${colorClass} ${size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5'} gap-1 cursor-help`}
          >
            <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />
            {showLabel && <span className="text-xs">{badge.name}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{badge.name}</p>
          {badge.earned_at && (
            <p className="text-xs text-muted-foreground">
              Earned {new Date(badge.earned_at).toLocaleDateString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function VerificationBadges({ badges, maxDisplay = 5, size = 'sm' }) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayBadges.map((badge, idx) => (
        <VerificationBadge key={idx} badge={badge} size={size} />
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}

export function TrustLevelBadge({ level, score }) {
  const levels = {
    fully_verified: { label: 'Fully Verified', color: 'bg-green-500', icon: ShieldCheck },
    partially_verified: { label: 'Verified', color: 'bg-blue-500', icon: Shield },
    basic_verified: { label: 'Basic', color: 'bg-yellow-500', icon: CheckCircle },
    unverified: { label: 'Unverified', color: 'bg-gray-400', icon: Shield }
  };

  const config = levels[level] || levels.unverified;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${config.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">{config.label}</p>
              {score !== undefined && (
                <p className="text-xs text-muted-foreground">{score}% verified</p>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Trust Score: {score}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default VerificationBadges;
