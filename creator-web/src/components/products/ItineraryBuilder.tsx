import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Search,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DestinationsMap } from '@/components/ui/DestinationsMap';
import { destinationsApi } from '@/api/destinations.api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ItineraryActivity {
  time?: string;
  title?: string;
  description?: string;
  duration?: string;
  cost?: string;
}

export interface ItineraryDayValue {
  dayNumber: number;
  title?: string;
  description?: string;
  location?: string;
  accommodation?: string;
  transport?: string;
  meals?: string;
  estimatedCost?: string;
  tips?: string;
  imageUrl?: string;
  activities?: ItineraryActivity[];
}

export interface ItineraryDetailsValue {
  startingCity?: string;
  endingCity?: string;
  totalDays?: number;
  totalNights?: number;
  difficultyLevel?: string;
  bestSeason?: string;
  estimatedBudget?: string;
  packingList?: string;
  isCustomizable?: boolean;
  destinations?: string[];
  includes?: string[];
  excludes?: string[];
  days?: ItineraryDayValue[];
}

interface ItineraryBuilderProps {
  value: ItineraryDetailsValue;
  onChange: (value: ItineraryDetailsValue) => void;
}

// ── Tag input helper ──────────────────────────────────────────────────────────

function TagInput({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
  color = 'green',
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  color?: 'green' | 'red';
}) {
  const [input, setInput] = useState('');
  const commit = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onAdd(val);
    setInput('');
  };
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={commit}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map((t) => (
            <span
              key={t}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                color === 'green'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
              onClick={() => onRemove(t)}
            >
              {t}
              <X className="w-3 h-3" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  onChange,
  onRemove,
}: {
  activity: ItineraryActivity;
  onChange: (updated: ItineraryActivity) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
      <div className="flex gap-2">
        <Input
          className="h-8 text-xs"
          placeholder="Time (e.g. 08:00)"
          value={activity.time ?? ''}
          onChange={(e) => onChange({ ...activity, time: e.target.value })}
        />
        <Input
          className="h-8 text-xs flex-[2]"
          placeholder="Activity title"
          value={activity.title ?? ''}
          onChange={(e) => onChange({ ...activity, title: e.target.value })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <Input
        className="h-8 text-xs"
        placeholder="Description"
        value={activity.description ?? ''}
        onChange={(e) => onChange({ ...activity, description: e.target.value })}
      />
      <div className="flex gap-2">
        <Input
          className="h-7 text-xs"
          placeholder="Duration (e.g. 2h)"
          value={activity.duration ?? ''}
          onChange={(e) => onChange({ ...activity, duration: e.target.value })}
        />
        <Input
          className="h-7 text-xs"
          placeholder="Cost (e.g. ₹500)"
          value={activity.cost ?? ''}
          onChange={(e) => onChange({ ...activity, cost: e.target.value })}
        />
      </div>
    </div>
  );
}

// ── Day card ──────────────────────────────────────────────────────────────────

function DayCard({
  day,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  day: ItineraryDayValue;
  index: number;
  total: number;
  onChange: (updated: ItineraryDayValue) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  const addActivity = () => {
    const activities = [...(day.activities ?? []), {}];
    onChange({ ...day, activities });
  };

  const updateActivity = (i: number, updated: ItineraryActivity) => {
    const activities = [...(day.activities ?? [])];
    activities[i] = updated;
    onChange({ ...day, activities });
  };

  const removeActivity = (i: number) => {
    const activities = (day.activities ?? []).filter((_, idx) => idx !== i);
    onChange({ ...day, activities });
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Day header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="font-medium text-gray-800 text-sm">
            {day.title || `Day ${index + 1}`}
          </span>
          {day.location && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {day.location}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={index === 0}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
          >
            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={index === total - 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
          >
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
          )}
        </div>
      </div>

      {/* Day body */}
      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Day Title</Label>
              <Input
                className="h-8 text-sm"
                placeholder={`Day ${index + 1} – e.g. Arrival in Bali`}
                value={day.title ?? ''}
                onChange={(e) => onChange({ ...day, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                className="h-8 text-sm"
                placeholder="e.g. Ubud, Bali"
                value={day.location ?? ''}
                onChange={(e) => onChange({ ...day, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              className="text-sm resize-none"
              placeholder="What happens today..."
              value={day.description ?? ''}
              onChange={(e) => onChange({ ...day, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Accommodation</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Kuta Beach Hotel"
                value={day.accommodation ?? ''}
                onChange={(e) => onChange({ ...day, accommodation: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Transport</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Private car"
                value={day.transport ?? ''}
                onChange={(e) => onChange({ ...day, transport: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meals Included</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Breakfast, Dinner"
                value={day.meals ?? ''}
                onChange={(e) => onChange({ ...day, meals: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Estimated Cost</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. ₹3,000"
                value={day.estimatedCost ?? ''}
                onChange={(e) => onChange({ ...day, estimatedCost: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tips / Notes</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Carry rain gear"
                value={day.tips ?? ''}
                onChange={(e) => onChange({ ...day, tips: e.target.value })}
              />
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-600">
                Activities ({day.activities?.length ?? 0})
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                onClick={addActivity}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Activity
              </Button>
            </div>
            {(day.activities ?? []).map((act, i) => (
              <ActivityRow
                key={i}
                activity={act}
                onChange={(updated) => updateActivity(i, updated)}
                onRemove={() => removeActivity(i)}
              />
            ))}
            {(!day.activities || day.activities.length === 0) && (
              <p className="text-xs text-gray-400 italic">
                No activities yet — click "Add Activity" to add one.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Destinations picker ───────────────────────────────────────────────────────

function DestinationsPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: countriesRes } = useQuery({
    queryKey: ['destinations', 'countries'],
    queryFn: () => destinationsApi.listCountries({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const countries: string[] = useMemo(() => {
    const list = (countriesRes?.data?.data ?? countriesRes?.data ?? []) as any[];
    return list.map((c: any) => c.name).filter(Boolean);
  }, [countriesRes]);

  const filtered = useMemo(
    () =>
      search.trim()
        ? countries.filter((c) =>
            c.toLowerCase().includes(search.toLowerCase()),
          )
        : countries,
    [countries, search],
  );

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((s) => s !== name)
        : [...selected, name],
    );
  };

  return (
    <div className="space-y-1.5">
      <Label>Destinations</Label>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((d) => (
            <span
              key={d}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#E8342A]/10 text-[#E8342A] border border-[#E8342A]/30 rounded-full text-xs font-medium cursor-pointer"
              onClick={() => toggle(d)}
            >
              <Navigation className="w-2.5 h-2.5" />
              {d}
              <X className="w-3 h-3" />
            </span>
          ))}
        </div>
      )}
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 bg-white text-left"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">
          {open ? 'Search destinations...' : 'Add destinations'}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <Input
              autoFocus
              className="h-8 text-sm"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No results</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selected.includes(c) ? 'text-[#E8342A] font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{c}</span>
                  {selected.includes(c) && (
                    <span className="w-4 h-4 rounded-full bg-[#E8342A] flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ItineraryBuilder ─────────────────────────────────────────────────────

export function ItineraryBuilder({ value, onChange }: ItineraryBuilderProps) {
  const update = useCallback(
    (patch: Partial<ItineraryDetailsValue>) => onChange({ ...value, ...patch }),
    [value, onChange],
  );

  const days = value.days ?? [{ dayNumber: 1, title: 'Day 1', activities: [] }];
  const includes = value.includes ?? [];
  const excludes = value.excludes ?? [];
  const destinations = value.destinations ?? [];

  const addDay = () => {
    const next: ItineraryDayValue = {
      dayNumber: days.length + 1,
      title: `Day ${days.length + 1}`,
      activities: [],
    };
    update({ days: [...days, next], totalDays: days.length + 1 });
  };

  const updateDay = (idx: number, updated: ItineraryDayValue) => {
    const next = [...days];
    next[idx] = { ...updated, dayNumber: idx + 1 };
    update({ days: next });
  };

  const removeDay = (idx: number) => {
    const next = days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1 }));
    update({ days: next, totalDays: next.length });
  };

  const moveDay = (idx: number, dir: -1 | 1) => {
    const next = [...days];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ days: next.map((d, i) => ({ ...d, dayNumber: i + 1 })) });
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itinerary Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Starting City</Label>
              <Input
                placeholder="e.g. Delhi"
                value={value.startingCity ?? ''}
                onChange={(e) => update({ startingCity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ending City</Label>
              <Input
                placeholder="e.g. Mumbai"
                value={value.endingCity ?? ''}
                onChange={(e) => update({ endingCity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Total Days</Label>
              <Input
                type="number"
                min="1"
                value={value.totalDays ?? days.length}
                onChange={(e) => update({ totalDays: Number(e.target.value) || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Nights</Label>
              <Input
                type="number"
                min="0"
                value={value.totalNights ?? ''}
                onChange={(e) => update({ totalNights: Number(e.target.value) || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Budget</Label>
              <Input
                placeholder="e.g. ₹25,000"
                value={value.estimatedBudget ?? ''}
                onChange={(e) => update({ estimatedBudget: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Difficulty Level</Label>
              <Select
                value={value.difficultyLevel ?? ''}
                onValueChange={(v) => update({ difficultyLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Best Season</Label>
              <Input
                placeholder="e.g. October – March"
                value={value.bestSeason ?? ''}
                onChange={(e) => update({ bestSeason: e.target.value })}
              />
            </div>
          </div>

          {/* Customizable toggle */}
          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={value.isCustomizable ?? false}
              onClick={() => update({ isCustomizable: !(value.isCustomizable ?? false) })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                value.isCustomizable ? 'bg-[#E8342A]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value.isCustomizable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <Label className="cursor-pointer" onClick={() => update({ isCustomizable: !value.isCustomizable })}>
              Customizable itinerary (travellers can request modifications)
            </Label>
          </div>

          {/* Destinations */}
          <DestinationsPicker selected={destinations} onChange={(d) => update({ destinations: d })} />

          {/* Includes / Excludes */}
          <div className="grid grid-cols-2 gap-4">
            <TagInput
              label="Includes"
              placeholder="e.g. Hotel stay"
              tags={includes}
              onAdd={(v) => update({ includes: [...includes, v] })}
              onRemove={(v) => update({ includes: includes.filter((i) => i !== v) })}
              color="green"
            />
            <TagInput
              label="Excludes"
              placeholder="e.g. Flights"
              tags={excludes}
              onAdd={(v) => update({ excludes: [...excludes, v] })}
              onRemove={(v) => update({ excludes: excludes.filter((i) => i !== v) })}
              color="red"
            />
          </div>

          {/* Packing list */}
          <div className="space-y-1.5">
            <Label>Packing List</Label>
            <Textarea
              rows={3}
              className="resize-none"
              placeholder="What should travellers pack? e.g. Sunscreen, trekking shoes, rain jacket..."
              value={value.packingList ?? ''}
              onChange={(e) => update({ packingList: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Day-by-day plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Day-by-Day Plan</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addDay}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Day
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {days.map((day, idx) => (
            <DayCard
              key={idx}
              day={day}
              index={idx}
              total={days.length}
              onChange={(updated) => updateDay(idx, updated)}
              onRemove={() => removeDay(idx)}
              onMoveUp={() => moveDay(idx, -1)}
              onMoveDown={() => moveDay(idx, 1)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Route map preview */}
      {destinations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-gray-700">Route Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4 px-4">
            <DestinationsMap destinations={destinations} height="260px" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
