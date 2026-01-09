'use client';

import { ReactElement } from 'react';
import { Shield, Users, AlertTriangle } from 'lucide-react';

interface WaiverSectionProps {
  icon: ReactElement;
  title: string;
  items: string[];
}

function WaiverSection({ icon, title, items }: WaiverSectionProps): ReactElement {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-sage/10 rounded-md">
          {icon}
        </div>
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>
      <ul className="space-y-2 ml-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-sage mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface WaiverContentProps {
  className?: string;
}

export function WaiverContent({ className = '' }: WaiverContentProps): ReactElement {
  const sections = [
    {
      icon: <Shield className="w-4 h-4 text-sage" />,
      title: 'Safety & Personal Responsibility',
      items: [
        'I will use good judgment when meeting or exchanging with other members',
        'I will meet in public places when possible and trust my instincts',
        'I will communicate promptly if plans change or I cannot follow through',
      ],
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-sage" />,
      title: 'Platform Limitations',
      items: [
        'CARE Collective is a volunteer-based mutual aid platform',
        'The platform does not verify members\' identities, backgrounds, or capabilities',
        'CARE Collective and Missouri State University are not liable for interactions or outcomes between members',
        'My participation is voluntary and at my own risk',
      ],
    },
    {
      icon: <Users className="w-4 h-4 text-sage" />,
      title: 'Community Standards',
      items: [
        'I will treat all members with respect and without judgment',
        'I will keep shared information confidential',
        'I will use member contact details only for CARE Collective exchanges',
        'I will report safety concerns to the administrator',
        'I understand my membership may be paused or removed if my behavior compromises community safety or trust',
      ],
    },
  ];

  return (
    <div className={className}>
      {sections.map((section, index) => (
        <WaiverSection
          key={index}
          icon={section.icon}
          title={section.title}
          items={section.items}
        />
      ))}
    </div>
  );
}

export default WaiverContent;
