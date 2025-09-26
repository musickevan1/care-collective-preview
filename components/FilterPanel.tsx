/**
 * @fileoverview Advanced filtering interface for Care Collective help requests
 * Provides category, urgency, status, and search filtering with URL state management
 */

'use client';

import { ReactElement, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Car,
  Home,
  Heart,
  Utensils,
  Baby,
  PawPrint,
  Laptop,
  Users,
  Coffee,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

export interface FilterOptions {
  search: string;
  status: string;
  category: string;
  urgency: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
  showAdvanced?: boolean;
}

const categories = [
  { value: 'all', label: 'All Categories', icon: Package },
  { value: 'groceries', label: 'Groceries', icon: Package },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'household', label: 'Household', icon: Home },
  { value: 'medical', label: 'Medical', icon: Heart },
  { value: 'meals', label: 'Meals', icon: Utensils },
  { value: 'childcare', label: 'Childcare', icon: Baby },
  { value: 'petcare', label: 'Pet Care', icon: PawPrint },
  { value: 'technology', label: 'Technology', icon: Laptop },
  { value: 'companionship', label: 'Companionship', icon: Users },
  { value: 'respite', label: 'Respite Care', icon: Coffee },
  { value: 'emotional', label: 'Emotional Support', icon: MessageCircle },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const statusOptions = [
  { value: 'all', label: 'All Status', color: 'default' },
  { value: 'open', label: 'Open', color: 'sage' },
  { value: 'in_progress', label: 'In Progress', color: 'secondary' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'outline' },
];

const urgencyOptions = [
  { value: 'all', label: 'All Urgency', icon: Clock, color: 'outline' },
  { value: 'normal', label: 'Normal', icon: CheckCircle, color: 'default' },
  { value: 'urgent', label: 'Urgent', icon: Clock, color: 'secondary' },
  { value: 'critical', label: 'Critical', icon: AlertTriangle, color: 'destructive' },
];

const sortOptions = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'urgency', label: 'Urgency Level' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
];

export function FilterPanel({ 
  onFilterChange, 
  className,
  showAdvanced = false 
}: FilterPanelProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL parameters
  const [filters, setFilters] = useState<FilterOptions>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || 'all',
    urgency: searchParams.get('urgency') || 'all',
    sortBy: searchParams.get('sort') || 'created_at',
    sortOrder: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
  });

  const [showFilters, setShowFilters] = useState(showAdvanced);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);

    // Update URL with new filters
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      }
    });
    
    const newUrl = params.toString() ? `/requests?${params.toString()}` : '/requests';
    router.push(newUrl, { scroll: false });
  }, [filters, onFilterChange, router]);

  const clearFilters = useCallback(() => {
    const clearedFilters: FilterOptions = {
      search: '',
      status: 'all',
      category: 'all',
      urgency: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    router.push('/requests', { scroll: false });
  }, [onFilterChange, router]);

  const hasActiveFilters = filters.search || 
    (filters.status !== 'all') || 
    (filters.category !== 'all') || 
    (filters.urgency !== 'all') ||
    (filters.sortBy !== 'created_at') ||
    (filters.sortOrder !== 'desc');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search requests by title or description..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10 pr-10"
          aria-label="Search help requests"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilters({ search: '' })}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Quick Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusOptions.map((status) => (
          <Button
            key={status.value}
            variant={filters.status === status.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters({ status: status.value })}
            className="text-xs"
          >
            {status.label}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="ml-2"
          aria-expanded={showFilters}
          aria-controls="advanced-filters"
        >
          <Filter className="h-3 w-3 mr-1" />
          Advanced
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card id="advanced-filters">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category-select">Category</Label>
              <Select 
                value={filters.category} 
                onValueChange={(value) => updateFilters({ category: value })}
              >
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency Filter */}
            <div className="space-y-2">
              <Label htmlFor="urgency-select">Urgency Level</Label>
              <div className="flex gap-2 flex-wrap">
                {urgencyOptions.map((urgency) => {
                  const IconComponent = urgency.icon;
                  return (
                    <Button
                      key={urgency.value}
                      variant={filters.urgency === urgency.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilters({ urgency: urgency.value })}
                      className="text-xs"
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {urgency.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort-select">Sort By</Label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => updateFilters({ sortBy: value })}
                >
                  <SelectTrigger id="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-select">Sort Order</Label>
                <Select 
                  value={filters.sortOrder} 
                  onValueChange={(value: 'asc' | 'desc') => updateFilters({ sortOrder: value })}
                >
                  <SelectTrigger id="order-select">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ search: '' })}
                className="ml-1 h-auto p-0"
                aria-label={`Remove search filter: ${filters.search}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {categories.find(c => c.value === filters.category)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ category: 'all' })}
                className="ml-1 h-auto p-0"
                aria-label={`Remove category filter`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.urgency !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {urgencyOptions.find(u => u.value === filters.urgency)?.label} priority
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ urgency: 'all' })}
                className="ml-1 h-auto p-0"
                aria-label={`Remove urgency filter`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}