import React, { useEffect, useState } from 'react';
import { apiPath } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function LineChartComponent({ token, filters }: { token: string | null; filters: Record<string, any> }) {
  const [data, setData] = useState<Array<{ month: string; count: number }>>([]);

  useEffect(() => {
    async function load() {
      const qs = new URLSearchParams();
      if (filters.startDate) qs.set('startDate', filters.startDate);
      if (filters.endDate) qs.set('endDate', filters.endDate);
      if (filters.storeLocation) qs.set('storeLocation', filters.storeLocation);
      if (filters.category) qs.set('category', filters.category);
      qs.set('months', '12');

      const res = await fetch(apiPath('/api/analytics/monthly?' + qs.toString()), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      setData(json.series || []);
    }

    void load();
  }, [token, JSON.stringify(filters)]);

  if (!data || data.length === 0) return <div>No monthly data</div>;

  return (
    <LineChart data={data} width={500} height={160}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
    </LineChart>
  );
}
