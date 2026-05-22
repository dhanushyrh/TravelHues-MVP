import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof DAYS[number];

interface OpeningHoursEditorProps {
  value?: Record<string, string>;
  onChange: (hours: Record<string, string>) => void;
}

export function OpeningHoursEditor({ value = {}, onChange }: OpeningHoursEditorProps) {
  const toggle = (day: Day) => {
    if (value[day] === 'closed') {
      onChange({ ...value, [day]: '09:00–22:00' });
    } else {
      onChange({ ...value, [day]: 'closed' });
    }
  };

  const update = (day: Day, val: string) => {
    onChange({ ...value, [day]: val });
  };

  return (
    <div className="space-y-1.5">
      <Label>Opening Hours</Label>
      <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
        {DAYS.map((day) => {
          const closed = value[day] === 'closed';
          return (
            <div key={day} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggle(day)}
                aria-label={`Toggle ${day}`}
                className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors ${closed ? 'bg-gray-300' : 'bg-[#E8342A]'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${closed ? 'left-0.5' : 'left-[18px]'}`}
                />
              </button>
              <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-600 capitalize">
                {day}
              </span>
              {closed ? (
                <span className="text-xs text-gray-400 italic">Closed</span>
              ) : (
                <Input
                  className="h-7 text-xs flex-1 bg-white"
                  placeholder="09:00–22:00"
                  value={value[day] ?? ''}
                  onChange={(e) => update(day, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">Format: 09:00–22:00 · Click toggle to mark as closed</p>
    </div>
  );
}
