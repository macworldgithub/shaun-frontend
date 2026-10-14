import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Download,
  ExternalLink,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  User,
  Car,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  RotateCcw,
  FileText,
  BadgeAlert,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import PaginationControls from '../components/PaginationControls';
import { virtualYardApi } from '../lib/api';
import { useSite } from '../contexts/SiteContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const YARDS = [
  'All Yards',
  'BYD Caroline Springs',
  'BYD Melbourne City',
  'BYD Nunawading',
  'BYD Fairfield',
  'BYD Doncaster',
  'BYD Wodonga',
];

const SETTLEMENT_STATUSES = [
  'All',
  'Paid',
  'Partially Paid',
  'Unpaid',
  'Zero Balance',
];

const PAYMENT_METHODS = [
  'All',
  'Credit Card',
  'EFT',
  'Finance',
  'EFTPOS',
  'Cash',
  'Cheque',
  'Other',
];

const DEAL_STATUSES = [
  'All',
  'Closed Signed Activated',
  'Closed Activated',
  'Closed Pending Activated',
  'Open',
  'Open Signed',
  'Open Pending',
  'Lost',
  'Lost Pending',
];

export default function VirtualYardDeals() {
  const navigate = useNavigate();
  const { activeSite } = useSite();
  const { isAdmin } = useAuth();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedYard, setSelectedYard] = useState('All Yards');
  const [settlementStatus, setSettlementStatus] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [dealStatus, setDealStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Data state
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Selected deal modal
  const [activeDeal, setActiveDeal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync with global site switcher if user changes header site
  useEffect(() => {
    if (activeSite && activeSite !== 'All Sites') {
      const matched = YARDS.find((y) => y.toLowerCase().includes(activeSite.toLowerCase().replace(/^byd\s+/i, '')));
      if (matched) {
        setSelectedYard(matched);
      }
    }
  }, [activeSite]);

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
      if (selectedYard && selectedYard !== 'All Yards') params.site = selectedYard;
      if (settlementStatus && settlementStatus !== 'All') params.settlement_status = settlementStatus;
      if (paymentMethod && paymentMethod !== 'All') params.payment_method = paymentMethod;
      if (dealStatus && dealStatus !== 'All') params.status = dealStatus;

      const data = await virtualYardApi.listDeals(params);
      setDeals(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.pages || 1);
      setStats(data.stats || null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load Virtual Yard deals');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedYard, settlementStatus, paymentMethod, dealStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedYard('All Yards');
    setSettlementStatus('All');
    setPaymentMethod('All');
    setDealStatus('All');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const isFilterActive =
    searchTerm !== '' ||
    selectedYard !== 'All Yards' ||
    settlementStatus !== 'All' ||
    paymentMethod !== 'All' ||
    dealStatus !== 'All';

  // Open deal detail
  const handleOpenDeal = async (invoiceId) => {
    setModalLoading(true);
    setActiveDeal(null);
    try {
      const fullDeal = await virtualYardApi.getDeal(invoiceId);
      setActiveDeal(fullDeal);
    } catch (err) {
      toast.error('Could not load deal details');
    } finally {
      setModalLoading(false);
    }
  };

  // Re-sync trigger
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await virtualYardApi.sync();
      toast.success(res.message || 'Virtual Yard data synced successfully');
      fetchDeals();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Export current view to CSV
  const handleExportCsv = () => {
    if (!deals.length) {
      toast.error('No deals to export');
      return;
    }
    const headers = [
      'Proposal #',
      'Invoice ID',
      'Customer',
      'Phone',
      'Email',
      'Vehicle',
      'Rego',
      'Stock #',
      'Yard',
      'Deal Total (AUD)',
      'Payments (AUD)',
      'Balance Due (AUD)',
      'Settlement Status',
      'Deal Status',
      'Payment Count',
      'Sold Date',
    ];

    const rows = deals.map((d) => [
      d.proposal_number || '',
      d.invoice_id || '',
      `"${(d.customer_name || '').replace(/"/g, '""')}"`,
      d.customer_phone || '',
      d.customer_email || '',
      `"${(d.vehicle || '').replace(/"/g, '""')}"`,
      d.rego || '',
      d.stock_no || '',
      `"${(d.location_name || '').replace(/"/g, '""')}"`,
      (d.deal_total || 0).toFixed(2),
      (d.payment_total || 0).toFixed(2),
      (d.balance_due || 0).toFixed(2),
      d.settlement_status || '',
      `"${(d.status || '').replace(/"/g, '""')}"`,
      d.payment_count || 0,
      d.sold_date || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VirtualYard_DealPayments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${deals.length} records to CSV`);
  };

  // Format currency helper
  const fmtCurrency = (val) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fmtCurrencyDetailed = (val) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E11B22]" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 font-mono">
              Virtual Yard Integration · Deal Ledger (§5.6)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1 flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-[#E11B22]" />
            Deal Payments & Deposits
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-3xl">
            Live Virtual Yard transaction ledger, customer deposit reconciliation, payment methods, and balance settlement across all dealership yards.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || !deals.length}
            className="text-xs font-semibold h-9"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-xs font-semibold h-9 border-[#E11B22]/30 text-[#B81319] hover:bg-[#FFEDED]"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync VY Data'}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="border-neutral-200 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Deal Value</span>
              <DollarSign className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {fmtCurrency(stats?.total_deal_value)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <span>{stats?.total_deals?.toLocaleString() || totalItems.toLocaleString()} deals matching</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 shadow-sm bg-emerald-50/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Payments Collected</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900">
              {fmtCurrency(stats?.total_collected)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <span>{stats?.total_payments_count?.toLocaleString() || 0} payment entries recorded</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 shadow-sm bg-amber-50/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Balance Outstanding</span>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-900">
              {fmtCurrency(stats?.total_balance_due)}
            </div>
            <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
              <span>Awaiting final settlement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Settlement Rate</span>
              <TrendingUp className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">
              {stats?.total_deal_value > 0
                ? `${Math.round((stats.total_collected / stats.total_deal_value) * 100)}%`
                : '100%'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <span>Overall collected / deal total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, vehicle, proposal #, invoice ID, stock #, rego, phone..."
              className="pl-9 h-9 text-xs bg-neutral-50 border-neutral-200 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
              >
                ×
              </button>
            )}
          </div>

          {/* Yard / Site Selector */}
          <Select value={selectedYard} onValueChange={(val) => { setSelectedYard(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-52 h-9 text-xs font-medium bg-neutral-50 border-neutral-200">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-neutral-500 shrink-0" />
              <SelectValue placeholder="Holding Yard" />
            </SelectTrigger>
            <SelectContent>
              {YARDS.map((yard) => (
                <SelectItem key={yard} value={yard} className="text-xs">
                  {yard}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Settlement Status */}
          <Select value={settlementStatus} onValueChange={(val) => { setSettlementStatus(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-44 h-9 text-xs font-medium bg-neutral-50 border-neutral-200">
              <CreditCard className="h-3.5 w-3.5 mr-1.5 text-neutral-500 shrink-0" />
              <SelectValue placeholder="Settlement" />
            </SelectTrigger>
            <SelectContent>
              {SETTLEMENT_STATUSES.map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {st === 'All' ? 'All Settlements' : st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Method */}
          <Select value={paymentMethod} onValueChange={(val) => { setPaymentMethod(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-40 h-9 text-xs font-medium bg-neutral-50 border-neutral-200">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method} className="text-xs">
                  {method === 'All' ? 'All Methods' : method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Deal Status */}
          <Select value={dealStatus} onValueChange={(val) => { setDealStatus(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full md:w-44 h-9 text-xs font-medium bg-neutral-50 border-neutral-200">
              <SelectValue placeholder="Deal Status" />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STATUSES.map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {st === 'All' ? 'All Deal Statuses' : st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset button */}
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs text-neutral-500 hover:text-neutral-900"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Active Yard Filter Notice */}
        {selectedYard !== 'All Yards' && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50/60 border border-red-200 text-xs text-red-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E11B22] animate-pulse" />
              <span>
                Filtered to holding location: <strong>{selectedYard}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedYard('All Yards')}
              className="text-[11px] font-semibold text-[#B81319] hover:underline"
            >
              Show All Yards
            </button>
          </div>
        )}
      </div>

      {/* Main Deals Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Deal / Proposal</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle & Stock</th>
                <th className="py-3 px-4">Holding Yard</th>
                <th className="py-3 px-4 text-right">Deal Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Settlement</th>
                <th className="py-3 px-4">Deal Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#E11B22] mb-2" />
                    <p className="text-xs">Loading Virtual Yard deal payment records...</p>
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400">
                    <Receipt className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-neutral-700">No matching deals found</p>
                    <p className="text-xs text-neutral-400 mt-1">Try adjusting your filters or search keywords</p>
                    {isFilterActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-3 text-xs"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                deals.map((deal) => {
                  const isSettled = deal.settlement_status === 'Paid';
                  const isPartial = deal.settlement_status === 'Partially Paid';
                  const isUnpaid = deal.settlement_status === 'Unpaid';
                  const hasDue = (deal.balance_due || 0) > 0;

                  return (
                    <tr
                      key={deal.invoice_id}
                      onClick={() => handleOpenDeal(deal.invoice_id)}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Deal / Proposal */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-neutral-900 group-hover:text-[#E11B22] transition-colors">
                          #{deal.proposal_number || deal.invoice_id}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Inv: {deal.invoice_id}
                        </div>
                        {deal.sold_date && (
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {deal.sold_date}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 truncate max-w-[180px]">
                          {deal.customer_name || '—'}
                        </div>
                        {deal.customer_phone && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {deal.customer_phone}
                          </div>
                        )}
                        {deal.customer_email && (
                          <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                            {deal.customer_email}
                          </div>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900 truncate max-w-[200px]">
                          {deal.vehicle || '—'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {deal.rego && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono bg-neutral-50">
                              {deal.rego}
                            </Badge>
                          )}
                          {deal.stock_no && (
                            <span className="text-[10px] text-neutral-500 font-mono">
                              Stock #{deal.stock_no}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Holding Yard */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-700 font-medium">
                          <Building2 className="h-3 w-3 text-neutral-400" />
                          {deal.location_name?.replace(/^BYD\s+/i, '') || '—'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-semibold text-neutral-900 whitespace-nowrap">
                        {fmtCurrencyDetailed(deal.deal_total)}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-emerald-700">
                          {fmtCurrencyDetailed(deal.payment_total)}
                        </div>
                        {deal.payment_count > 0 && (
                          <div className="text-[10px] text-neutral-400">
                            {deal.payment_count} payment{deal.payment_count > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            hasDue ? 'text-amber-700 font-bold' : 'text-neutral-400'
                          }`}
                        >
                          {fmtCurrencyDetailed(deal.balance_due)}
                        </span>
                      </td>

                      {/* Settlement Pill */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isSettled
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800'
                              : isUnpaid
                              ? 'bg-red-100 text-red-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {isSettled ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : isPartial ? (
                            <Clock className="h-3 w-3 text-amber-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          )}
                          {deal.settlement_status || 'Pending'}
                        </span>
                      </td>

                      {/* Deal Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] text-neutral-600 truncate max-w-[140px] block" title={deal.status}>
                          {deal.status || '—'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeal(deal.invoice_id)}
                          className="h-8 px-2.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        >
                          Ledger
                          <ChevronRight className="h-3.5 w-3.5 ml-1 text-neutral-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationControls
          page={currentPage}
          pageCount={totalPages}
          total={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Deal Payment Ledger Detail Modal */}
      <Dialog open={!!activeDeal} onOpenChange={(open) => !open && setActiveDeal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {activeDeal && (
            <div className="space-y-6 p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-neutral-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                      Virtual Yard Deal #{activeDeal.proposal_number || activeDeal.invoice_id}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      Inv #{activeDeal.invoice_id}
                    </Badge>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        activeDeal.settlement_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeDeal.settlement_status === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {activeDeal.settlement_status}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-neutral-900 mt-1">
                    {activeDeal.customer_name || 'Customer Record'}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {activeDeal.vehicle} · {activeDeal.location_name}
                  </p>
                </div>

                {/* External Links */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeDeal.matched_client && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const id = activeDeal.matched_client.id;
                        setActiveDeal(null);
                        navigate(`/clients/${id}`);
                      }}
                      className="bg-[#E11B22] hover:bg-[#B81319] text-white text-xs h-8"
                    >
                      <User className="h-3.5 w-3.5 mr-1" />
                      Open Client Profile
                    </Button>
                  )}

                  {activeDeal.source_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs h-8"
                    >
                      <a href={activeDeal.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Virtual Yard Portal
                      </a>
                    </Button>
                  )}

                  {activeDeal.payment_report_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs h-8"
                    >
                      <a href={activeDeal.payment_report_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Payment Report PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Settlement Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                    Total Deal Amount
                  </span>
                  <span className="text-lg font-bold text-neutral-900 mt-1 block">
                    {fmtCurrencyDetailed(activeDeal.deal_total)}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 block">
                    Payments Recorded
                  </span>
                  <span className="text-lg font-bold text-emerald-900 mt-1 block">
                    {fmtCurrencyDetailed(activeDeal.payment_total)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    {activeDeal.payments?.length || 0} transaction{activeDeal.payments?.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 block">
                    Balance Due
                  </span>
                  <span className="text-lg font-bold text-amber-900 mt-1 block">
                    {fmtCurrencyDetailed(activeDeal.balance_due)}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    {activeDeal.balance_due > 0 ? 'Pending customer payment' : 'Fully settled'}
                  </span>
                </div>
              </div>

              {/* Deal Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500 block">Phone</span>
                  <span className="font-semibold text-neutral-900">{activeDeal.customer_phone || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Email</span>
                  <span className="font-semibold text-neutral-900 truncate block">{activeDeal.customer_email || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Rego / Stock</span>
                  <span className="font-semibold text-neutral-900 font-mono">
                    {activeDeal.rego || '—'} {activeDeal.stock_no ? `(Stock #${activeDeal.stock_no})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Sold Date</span>
                  <span className="font-semibold text-neutral-900">{activeDeal.sold_date || '—'}</span>
                </div>
              </div>

              {/* Payments Ledger Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#E11B22]" />
                    Payment Ledger Entries ({activeDeal.payments?.length || 0})
                  </h3>
                </div>

                {activeDeal.payments && activeDeal.payments.length > 0 ? (
                  <div className="border border-neutral-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Transaction Details / Memo</th>
                          <th className="py-2.5 px-3 text-right">GST</th>
                          <th className="py-2.5 px-3 text-right">Amount (AUD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {activeDeal.payments.map((p, idx) => (
                          <tr key={p.line_id || idx} className="hover:bg-neutral-50">
                            <td className="py-2.5 px-3 font-mono text-neutral-700 whitespace-nowrap">
                              {p.date || '—'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[10px] bg-neutral-50 font-medium">
                                {p.method || 'Payment'}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-700">
                              <div className="font-medium">{p.details || 'Payment received'}</div>
                              {p.transaction_id && p.transaction_id !== '0' && (
                                <div className="text-[10px] font-mono text-neutral-400">
                                  Tx: {p.transaction_id}
                                </div>
                              )}
                              {p.account_code && (
                                <div className="text-[10px] text-neutral-400">
                                  Acct: {p.account_code}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-neutral-500 font-mono whitespace-nowrap">
                              {fmtCurrencyDetailed(p.gst)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono whitespace-nowrap">
                              {fmtCurrencyDetailed(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-lg border border-dashed border-neutral-200 text-neutral-400 text-xs">
                    No payment records found on this deal invoice in Virtual Yard.
                  </div>
                )}
              </div>

              {/* Refunds if any */}
              {activeDeal.refunds && activeDeal.refunds.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Refunds ({activeDeal.refunds.length})
                  </h3>
                  <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50/30">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-red-50 text-red-900 font-semibold text-[10px]">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Details</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {activeDeal.refunds.map((r, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-mono">{r.date || '—'}</td>
                            <td className="py-2 px-3">{r.details || 'Refund processed'}</td>
                            <td className="py-2 px-3 text-right font-bold text-red-700 font-mono">
                              -{fmtCurrencyDetailed(r.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sale Items / Invoice Lines */}
              {activeDeal.invoice_lines && activeDeal.invoice_lines.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Sale Items & Charges Breakdown ({activeDeal.invoice_lines.length})
                  </h3>
                  <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-600 sticky top-0">
                        <tr className="border-b border-neutral-200 text-[10px]">
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3 text-right">Inc. GST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {activeDeal.invoice_lines.map((line, i) => (
                          <tr key={i} className="hover:bg-neutral-50/50">
                            <td className="py-1.5 px-3 text-[11px] font-mono text-neutral-500">
                              {line.reference_no || line.type || 'Item'}
                            </td>
                            <td className="py-1.5 px-3 text-neutral-800">{line.details || '—'}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-neutral-900 font-medium">
                              {fmtCurrencyDetailed(line.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
