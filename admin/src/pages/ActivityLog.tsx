import React, { useEffect, useState } from 'react';
import {
    Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
    Chip, InputAdornment, IconButton, Avatar,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
    Search, Close, History, Edit, Delete, Add, SwapHoriz,
    ContentCopy,
} from '@mui/icons-material';
import apiClient from '../services/api.service';

const ACTION_COLORS: Record<string, string> = {
    CREATE: '#10B981',
    UPDATE: '#3B82F6',
    DELETE: '#EF4444',
    STATUS_CHANGE: '#F59E0B',
    DUPLICATE: '#8B5CF6',
    LOGIN: '#6366F1',
    EXPORT: '#0EA5E9',
    OTHER: '#94A3B8',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
    CREATE: <Add sx={{ fontSize: 16 }} />,
    UPDATE: <Edit sx={{ fontSize: 16 }} />,
    DELETE: <Delete sx={{ fontSize: 16 }} />,
    STATUS_CHANGE: <SwapHoriz sx={{ fontSize: 16 }} />,
    DUPLICATE: <ContentCopy sx={{ fontSize: 16 }} />,
};

const ActivityLog: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params: any = { page: page + 1, limit: pageSize };
            if (searchQuery) params.search = searchQuery;
            if (actionFilter) params.action = actionFilter;
            if (entityFilter) params.entityType = entityFilter;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;

            const result = await apiClient.get<any>('/admin/activity-logs', params);
            setLogs(result?.logs || []);
            setTotal(result?.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to load activity logs', error);
            setLogs([]);
        }
        setLoading(false);
    };

    useEffect(() => { loadLogs(); }, [page, pageSize, actionFilter, entityFilter, dateFrom, dateTo]);
    useEffect(() => {
        const timeout = setTimeout(() => loadLogs(), 400);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const columns: GridColDef[] = [
        {
            field: 'user', headerName: 'Employee', width: 180,
            renderCell: (params) => {
                const user = params.row.user;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#3B82F6', fontSize: 13 }}>
                            {(user?.name || 'A').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{user?.name || 'Admin'}</Typography>
                            <Typography variant="caption" color="text.secondary">{user?.role || ''}</Typography>
                        </Box>
                    </Box>
                );
            },
        },
        {
            field: 'action', headerName: 'Action', width: 140,
            renderCell: (params) => (
                <Chip
                    icon={ACTION_ICONS[params.value] as any}
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: ACTION_COLORS[params.value] + '15',
                        color: ACTION_COLORS[params.value],
                        fontWeight: 600,
                        border: `1px solid ${ACTION_COLORS[params.value]}30`,
                    }}
                />
            ),
        },
        {
            field: 'entityType', headerName: 'Entity', width: 110,
            renderCell: (params) => (
                <Chip label={params.value} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
            ),
        },
        {
            field: 'description', headerName: 'Description', flex: 1, minWidth: 250,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontSize: 13, whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'createdAt', headerName: 'Time', width: 170,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {new Date(params.value).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                </Typography>
            ),
        },
        {
            field: 'ip', headerName: 'IP', width: 130,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">{params.value || '—'}</Typography>
            ),
        },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History sx={{ color: '#3B82F6', fontSize: 28 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>Activity Log</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    {total} total entries
                </Typography>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff' } }}
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment>,
                        endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchQuery('')}><Close fontSize="small" /></IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />

                <FormControl sx={{ minWidth: 130 }} size="small">
                    <InputLabel>Action</InputLabel>
                    <Select value={actionFilter} label="Action" onChange={(e) => setActionFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'DUPLICATE'].map(a => (
                            <MenuItem key={a} value={a}>{a}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel>Entity</InputLabel>
                    <Select value={entityFilter} label="Entity" onChange={(e) => setEntityFilter(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {['Order', 'Product', 'User', 'Invoice', 'Coupon', 'Category', 'Brand'].map(e => (
                            <MenuItem key={e} value={e}>{e}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="From" type="date" size="small"
                    InputLabelProps={{ shrink: true }}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    sx={{ width: 150 }}
                />
                <TextField
                    label="To" type="date" size="small"
                    InputLabelProps={{ shrink: true }}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    sx={{ width: 150 }}
                />
            </Box>

            {/* Data Grid */}
            <DataGrid
                rows={logs}
                columns={columns}
                loading={loading}
                getRowId={(row) => row._id}
                rowCount={total}
                paginationMode="server"
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                autoHeight
                sx={{
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    minHeight: 400,
                    '& .MuiDataGrid-row': { cursor: 'default' },
                }}
            />
        </Box>
    );
};

export default ActivityLog;
